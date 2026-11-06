'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sha256 = (content) => crypto.createHash('sha256').update(content).digest('hex');

function isHighSignalFact(fact) {
  if (!fact || !fact.kind) return false;
  // Filter out internal package lockfile key diffs that explode in size
  if (fact.kind === 'json-key' && /packages?\.lock\.json/i.test(fact.path || '')) return false;
  return true;
}

function partitionCandidate(candidateRecord, outDir) {
  const version = candidateRecord.version;
  const targetDir = outDir ? path.join(outDir, version) : null;
  const changes = candidateRecord.changes || [];
  const rawFacts = candidateRecord.facts || [];
  const highSignalFacts = rawFacts.filter(isHighSignalFact);

  // 1. Group changes and facts by scope
  const partitionedChanges = {
    backend: [],
    frontend: [],
    database: [],
    shared: []
  };

  const factsByPath = new Map();
  for (const fact of highSignalFacts) {
    if (fact.path) {
      const list = factsByPath.get(fact.path) || [];
      list.push(fact);
      factsByPath.set(fact.path, list);
    }
  }

  // Also index findings if changes array is empty (e.g. package-first candidate)
  const changesToProcess = changes.length > 0 ? changes : [
    ...((candidateRecord.findings && candidateRecord.findings.backend) || []),
    ...((candidateRecord.findings && candidateRecord.findings.frontend) || []),
    ...((candidateRecord.findings && candidateRecord.findings.shared) || [])
  ];

  let beIdx = 0, feIdx = 0, dbIdx = 0, shIdx = 0;

  for (let idx = 0; idx < changesToProcess.length; idx++) {
    const change = changesToProcess[idx];
    const filePath = change.path || 'unknown';
    const cat = change.category || 'other';
    const scope = change.scope || 'shared';
    const status = change.status || 'M';

    const changeType = status === 'A' ? 'ADDED' : status === 'D' ? 'DELETED' : status.startsWith('R') ? 'RENAMED' : 'MODIFIED';
    const attachedFacts = factsByPath.get(filePath) || [];

    let targetScope = scope;
    let id = '';

    if (cat === 'ef-migration' || cat === 'sql-script') {
      targetScope = 'database';
      id = `CHG-${version}-DB-${String(++dbIdx).padStart(3, '0')}`;
    } else if (scope === 'backend') {
      targetScope = 'backend';
      id = `CHG-${version}-BE-${String(++beIdx).padStart(3, '0')}`;
    } else if (scope === 'frontend') {
      targetScope = 'frontend';
      id = `CHG-${version}-FE-${String(++feIdx).padStart(3, '0')}`;
    } else {
      targetScope = 'shared';
      id = `CHG-${version}-SH-${String(++shIdx).padStart(3, '0')}`;
    }

    const deterministicFacts = {};
    if (attachedFacts.length) {
      deterministicFacts.facts = attachedFacts;
    }

    const isHighRisk = cat === 'ef-migration' || cat === 'sql-script' ||
      cat === 'dotnet-target-framework-or-package-refs' || cat === 'npm-dependency' ||
      changeType === 'DELETED';

    const item = {
      id,
      category: cat,
      path: filePath,
      oldPath: change.oldPath || null,
      changeType,
      deterministicFacts,
      semanticAssessment: {
        impact: isHighRisk ? 'MANUAL_REVIEW_REQUIRED' : 'INFERRED_SAFE',
        confidence: isHighRisk ? 'HIGH' : 'MEDIUM',
        rationale: isHighRisk ? `Critical update in ${cat}` : `Standard ${changeType.toLowerCase()} change in ${cat}`,
        requiresHumanReview: isHighRisk,
        requiresMigrationExecution: cat === 'ef-migration' || cat === 'sql-script'
      },
      evidenceRef: `evidence/raw-diff.json#/gitDiff/rawChanges/${idx}`,
      verificationStatus: change.crossCheck || 'source-diff-observed'
    };

    partitionedChanges[targetScope].push(item);
  }

  // 2. Build Raw Evidence
  const rawDiff = {
    schemaVersion: 2,
    version,
    provenance: {
      coreRepoPath: (candidateRecord.sources && candidateRecord.sources.coreRepoPath) || '',
      commitRange: {
        from: (candidateRecord.identity && candidateRecord.identity.fromCommit) || null,
        to: (candidateRecord.identity && candidateRecord.identity.toCommit) || ''
      },
      tagRange: (candidateRecord.sources && candidateRecord.sources.tagRange) || { from: null, to: '' },
      sourceBranch: (candidateRecord.sources && candidateRecord.sources.sourceBranch) || null,
      releaseNotesHash: (candidateRecord.identity && candidateRecord.identity.notesHash) || null,
      analyzerVersion: (candidateRecord.identity && candidateRecord.identity.analyzerVersion) || '2.1.0',
      ingestedAt: candidateRecord.ingestedAt || new Date().toISOString()
    },
    gitDiff: {
      totalFilesChanged: changes.length,
      rawChanges: changes.map((c) => ({
        status: c.status || 'M',
        path: c.path || '',
        oldPath: c.oldPath || null
      }))
    }
  };

  // 3. Generate Release Notes
  const releaseNotesLines = [
    `# NGO Core Release Notes: ${version}`,
    '',
    `## Summary`,
    `Core ${version} changes: ${partitionedChanges.database.length} database, ${partitionedChanges.backend.length} backend, ${partitionedChanges.frontend.length} frontend, ${partitionedChanges.shared.length} shared.`,
    ''
  ];

  if (partitionedChanges.database.length) {
    releaseNotesLines.push('## Database Migrations');
    for (const c of partitionedChanges.database.slice(0, 20)) {
      releaseNotesLines.push(`- [${c.id}](changes/database.json#${c.id}): ${c.changeType} ${c.path}`);
    }
    if (partitionedChanges.database.length > 20) {
      releaseNotesLines.push(`- ... and ${partitionedChanges.database.length - 20} more database changes`);
    }
    releaseNotesLines.push('');
  }

  const highRiskBackend = partitionedChanges.backend.filter((c) => c.semanticAssessment.requiresHumanReview);
  if (highRiskBackend.length) {
    releaseNotesLines.push('## Backend High Risk / Breaking Changes');
    for (const c of highRiskBackend.slice(0, 20)) {
      releaseNotesLines.push(`- [${c.id}](changes/backend.json#${c.id}): ${c.category} in ${c.path}`);
    }
    if (highRiskBackend.length > 20) {
      releaseNotesLines.push(`- ... and ${highRiskBackend.length - 20} more backend review items`);
    }
    releaseNotesLines.push('');
  }

  const highRiskFrontend = partitionedChanges.frontend.filter((c) => c.semanticAssessment.requiresHumanReview);
  if (highRiskFrontend.length) {
    releaseNotesLines.push('## Frontend High Risk / Dependencies');
    for (const c of highRiskFrontend.slice(0, 20)) {
      releaseNotesLines.push(`- [${c.id}](changes/frontend.json#${c.id}): ${c.category} in ${c.path}`);
    }
    releaseNotesLines.push('');
  }

  releaseNotesLines.push('## Upgrade Instructions');
  if (partitionedChanges.database.length) {
    releaseNotesLines.push('1. Review and apply database migrations before deploying API services.');
  } else {
    releaseNotesLines.push('1. Standard dependency and package update instructions apply.');
  }

  const releaseNotesContent = releaseNotesLines.join('\n') + '\n';

  // 4. Serialize Partitions and Calculate Hashes
  const rawDiffStr = JSON.stringify(rawDiff, null, 2) + '\n';
  const beStr = JSON.stringify({
    schemaVersion: 2,
    version,
    scope: 'backend',
    recordCount: partitionedChanges.backend.length,
    changes: partitionedChanges.backend
  }, null, 2) + '\n';

  const feStr = JSON.stringify({
    schemaVersion: 2,
    version,
    scope: 'frontend',
    recordCount: partitionedChanges.frontend.length,
    changes: partitionedChanges.frontend
  }, null, 2) + '\n';

  const shStr = JSON.stringify({
    schemaVersion: 2,
    version,
    scope: 'shared',
    recordCount: partitionedChanges.shared.length,
    changes: partitionedChanges.shared
  }, null, 2) + '\n';

  const dbStr = JSON.stringify({
    schemaVersion: 2,
    version,
    scope: 'database',
    recordCount: partitionedChanges.database.length,
    changes: partitionedChanges.database
  }, null, 2) + '\n';

  // 5. Build Manifest
  const manifest = {
    schemaVersion: 2,
    version,
    lifecycle: {
      status: 'VALIDATED',
      generatedAt: rawDiff.provenance.ingestedAt,
      validatedAt: new Date().toISOString(),
      reviewedAt: null,
      publishedAt: null,
      reviewedBy: null
    },
    identity: {
      analyzerVersion: rawDiff.provenance.analyzerVersion,
      version,
      fromCommit: rawDiff.provenance.commitRange.from,
      toCommit: rawDiff.provenance.commitRange.to,
      notesHash: rawDiff.provenance.releaseNotesHash,
      key: (candidateRecord.identity && candidateRecord.identity.key) || sha256(version)
    },
    summary: {
      totalFilesChanged: changes.length,
      highSignalChangeCount: partitionedChanges.backend.length + partitionedChanges.frontend.length +
        partitionedChanges.shared.length + partitionedChanges.database.length,
      unresolvedAmbiguities: (candidateRecord.unresolvedItems || []).length
    },
    partitions: {
      evidence: {
        path: 'evidence/raw-diff.json',
        size: Buffer.byteLength(rawDiffStr, 'utf8'),
        sha256: sha256(rawDiffStr),
        recordCount: rawDiff.gitDiff.rawChanges.length
      },
      backend: {
        path: 'changes/backend.json',
        size: Buffer.byteLength(beStr, 'utf8'),
        sha256: sha256(beStr),
        recordCount: partitionedChanges.backend.length
      },
      frontend: {
        path: 'changes/frontend.json',
        size: Buffer.byteLength(feStr, 'utf8'),
        sha256: sha256(feStr),
        recordCount: partitionedChanges.frontend.length
      },
      shared: {
        path: 'changes/shared.json',
        size: Buffer.byteLength(shStr, 'utf8'),
        sha256: sha256(shStr),
        recordCount: partitionedChanges.shared.length
      },
      database: {
        path: 'changes/database.json',
        size: Buffer.byteLength(dbStr, 'utf8'),
        sha256: sha256(dbStr),
        recordCount: partitionedChanges.database.length
      },
      releaseNotes: {
        path: 'release-notes.md',
        size: Buffer.byteLength(releaseNotesContent, 'utf8'),
        sha256: sha256(releaseNotesContent)
      }
    }
  };

  manifest.manifestHash = sha256(JSON.stringify(manifest));

  const manifestStr = JSON.stringify(manifest, null, 2) + '\n';

  // 6. Write if output directory provided
  if (targetDir) {
    fs.mkdirSync(path.join(targetDir, 'evidence'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'changes'), { recursive: true });

    fs.writeFileSync(path.join(targetDir, 'manifest.json'), manifestStr);
    fs.writeFileSync(path.join(targetDir, 'release-notes.md'), releaseNotesContent);
    fs.writeFileSync(path.join(targetDir, 'evidence', 'raw-diff.json'), rawDiffStr);
    fs.writeFileSync(path.join(targetDir, 'changes', 'backend.json'), beStr);
    fs.writeFileSync(path.join(targetDir, 'changes', 'frontend.json'), feStr);
    fs.writeFileSync(path.join(targetDir, 'changes', 'shared.json'), shStr);
    fs.writeFileSync(path.join(targetDir, 'changes', 'database.json'), dbStr);
  }

  return {
    targetDir,
    manifest,
    rawDiff,
    releaseNotesContent,
    partitionedChanges
  };
}

module.exports = {
  partitionCandidate,
  isHighSignalFact,
  sha256
};
