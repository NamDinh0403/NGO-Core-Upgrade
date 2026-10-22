'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sha256 = (content) => crypto.createHash('sha256').update(content).digest('hex');

function toFinding(change, scope) {
  return {
    scope,
    category: change.category,
    path: change.path,
    status: change.changeType === 'ADDED' ? 'A' : change.changeType === 'DELETED' ? 'D' : change.changeType === 'RENAMED' ? 'R' : 'M',
    oldPath: change.oldPath || undefined,
    statement: `${change.changeType === 'ADDED' ? 'Added' : change.changeType === 'DELETED' ? 'Deleted' : change.changeType === 'RENAMED' ? 'Renamed to' : 'Modified'} ${change.path}`,
    source: 'git-diff',
    crossCheck: change.verificationStatus || 'CONFIRMED_BY_DIFF_AND_NOTES',
    correlationOnly: false,
    evidence: change.evidenceRef || ''
  };
}

function readRelease(releasesDir, version) {
  const v2Dir = path.join(releasesDir, version);
  const manifestPath = path.join(v2Dir, 'manifest.json');

  // Schema v2 directory format
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Lazy load partitions only when requested
    const loadPartition = (relPath) => {
      const full = path.join(v2Dir, relPath);
      return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf8')) : null;
    };

    const bePart = loadPartition('changes/backend.json') || { changes: [] };
    const fePart = loadPartition('changes/frontend.json') || { changes: [] };
    const shPart = loadPartition('changes/shared.json') || { changes: [] };
    const dbPart = loadPartition('changes/database.json') || { changes: [] };

    const findings = {
      backend: bePart.changes.map((c) => toFinding(c, 'backend')),
      frontend: fePart.changes.map((c) => toFinding(c, 'frontend')),
      shared: [
        ...dbPart.changes.map((c) => toFinding(c, 'shared')),
        ...shPart.changes.map((c) => toFinding(c, 'shared'))
      ]
    };

    const record = {
      schemaVersion: 1,
      version: manifest.version,
      status: 'CANDIDATE',
      identity: manifest.identity,
      ingestedAt: manifest.lifecycle.generatedAt,
      sources: {
        coreRepoPath: '',
        releaseNotesPath: fs.existsSync(path.join(v2Dir, 'release-notes.md')) ? 'provided' : null,
        tagRange: { from: manifest.identity.fromCommit, to: manifest.identity.toCommit }
      },
      findings,
      unresolvedItems: [],
      nextAction: `Developer: review partitioned release at ${v2Dir}, then promote applicable findings.`,
      contentHash: manifest.manifestHash,
      v2: {
        dirPath: v2Dir,
        manifest
      }
    };

    return {
      path: manifestPath,
      isPartitioned: true,
      manifest,
      record
    };
  }

  // Schema v1 single JSON file format
  const v1File = path.join(releasesDir, `${version}.json`);
  if (fs.existsSync(v1File)) {
    const record = JSON.parse(fs.readFileSync(v1File, 'utf8'));
    return {
      path: v1File,
      isPartitioned: false,
      manifest: null,
      record
    };
  }

  return null;
}

function readScope(releasesDir, version, scope) {
  const v2Dir = path.join(releasesDir, version);
  const partitionFile = path.join(v2Dir, 'changes', `${scope}.json`);
  if (fs.existsSync(partitionFile)) {
    return JSON.parse(fs.readFileSync(partitionFile, 'utf8'));
  }
  // Fallback to loading synthesized record if v1
  const release = readRelease(releasesDir, version);
  if (!release) return null;
  return {
    schemaVersion: 2,
    version,
    scope,
    changes: (release.record.findings && release.record.findings[scope]) || []
  };
}

module.exports = {
  readRelease,
  readScope,
  toFinding
};
