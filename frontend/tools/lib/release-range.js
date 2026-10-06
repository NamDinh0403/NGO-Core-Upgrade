'use strict';
/*
 * Release range resolver (IReleaseRangeResolver).
 * Given sourceVersion S and targetVersion T, deterministically select the
 * atomic requirements where S < releaseVersion <= T, apply duplicate and
 * supersession relationships, and trigger reusable framework migrations
 * (e.g. Angular 10 -> 15) based on the Angular major transition.
 * Evidence-driven only: never infers duplicates/supersession without records.
 * Dependency-free, Node 14+.
 */
const core = require('./core');
const store = require('./release-knowledge');

function inRange(version, source, target) {
  const gtSource = core.compareVersions(version, source) > 0; // strictly greater than S
  const leTarget = core.compareVersions(version, target) <= 0; // <= T
  return gtSource && leTarget;
}

// Decide whether the reusable "angular-10-to-15" migration should load, based
// on the Angular major transition across the range.
function migrationTriggered(migration, sourceMajor, targetMajor) {
  if (sourceMajor == null || targetMajor == null) return false;
  const t = migration.trigger || {};
  if (t.kind === 'angular-major-jump') {
    const okSource = sourceMajor <= (t.sourceMajorMax == null ? 999 : t.sourceMajorMax);
    const okTarget = targetMajor >= (t.targetMajorMin == null ? 0 : t.targetMajorMin);
    const increase = t.requireIncrease ? targetMajor > sourceMajor : true;
    return okSource && okTarget && increase;
  }
  return false;
}

function resolve(sourceVersion, targetVersion, opts) {
  opts = opts || {};
  const all = store.allRequirements(sourceVersion, targetVersion, opts.track);
  const selectedRaw = all.filter((r) => inRange(r.releaseVersion, sourceVersion, targetVersion));
  const idsInRange = new Set(selectedRaw.map((r) => r.id));

  const dropped = [];
  const kept = [];
  for (const r of selectedRaw) {
    // Supersession: drop if a superseding requirement is also in range.
    if (r.supersededBy && idsInRange.has(r.supersededBy)) {
      dropped.push({ id: r.id, reason: 'SUPERSEDED', by: r.supersededBy });
      continue;
    }
    // Duplicate/backport: drop if the primary it duplicates is also in range.
    if (r.duplicateOf && idsInRange.has(r.duplicateOf)) {
      dropped.push({ id: r.id, reason: 'DUPLICATE', of: r.duplicateOf });
      continue;
    }
    kept.push(r);
  }

  // Reusable migrations by framework transition.
  const sourceMajor = store.angularMajorAt(sourceVersion);
  const targetMajor = store.angularMajorAt(targetVersion);
  const migrationRequirements = [];
  const triggeredMigrations = [];
  for (const mig of store.migrations()) {
    if (migrationTriggered(mig, sourceMajor, targetMajor)) {
      triggeredMigrations.push(mig.reusableMigration);
      for (const mr of (mig.requirements || [])) migrationRequirements.push(mr);
    }
  }

  const versions = Array.from(new Set(kept.map((r) => r.releaseVersion)))
    .sort((a, b) => core.compareVersions(a, b));

  return {
    sourceVersion,
    targetVersion,
    sourceAngularMajor: sourceMajor,
    targetAngularMajor: targetMajor,
    versions,
    requirements: kept,
    droppedRequirements: dropped,
    reusableMigrations: triggeredMigrations,
    migrationRequirements,
  };
}

module.exports = { resolve, inRange, migrationTriggered };
