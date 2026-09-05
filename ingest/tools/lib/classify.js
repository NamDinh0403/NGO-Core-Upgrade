'use strict';
/*
 * Generic changed-file-path -> {scope, category} classifier. Deliberately
 * simple pattern matching, not a semantic analyzer — it exists to route a
 * git-diff finding to the track that cares about it (backend/.NET vs
 * frontend/Angular vs shared/deployment), not to judge risk or correctness.
 * Every classification stays a CANDIDATE finding for developer review.
 */

const RULES = [
  // --- backend / .NET ---
  { re: /\.csproj$|Directory\.(Build|Packages)\.props$/i, scope: 'backend', category: 'dotnet-target-framework-or-package-refs' },
  { re: /\/Migrations\/.*\.cs$/i, scope: 'backend', category: 'ef-migration' },
  { re: /appsettings.*\.json$/i, scope: 'backend', category: 'backend-config-key' },
  { re: /web\.config$/i, scope: 'shared', category: 'deployment-config' },
  { re: /\.cs$/i, scope: 'backend', category: 'dotnet-source' },
  { re: /\.sql$/i, scope: 'shared', category: 'sql-script' },

  // --- frontend / Angular ---
  { re: /(^|\/)package(-lock)?\.json$/i, scope: 'frontend', category: 'npm-dependency' },
  { re: /angular\.json$/i, scope: 'frontend', category: 'angular-workspace' },
  { re: /(^|\/)src\/environments\/.*\.ts$/i, scope: 'frontend', category: 'frontend-environment-config' },
  { re: /\.(ts|html|scss|css)$/i, scope: 'frontend', category: 'frontend-source' },

  // --- shared / pipeline ---
  { re: /\.ya?ml$/i, scope: 'shared', category: 'pipeline-config' },
];

function classify(path) {
  for (const rule of RULES) {
    if (rule.re.test(path)) return { scope: rule.scope, category: rule.category };
  }
  return { scope: 'shared', category: 'other' };
}

module.exports = { classify, RULES };
