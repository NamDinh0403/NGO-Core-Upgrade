'use strict';
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..', '..');
const memoryTiers = ['episodes', 'candidates', 'approved', 'rejected'];
const sharedSchemas = ['episode.schema.json', 'error-pattern.schema.json', 'fix-pattern.schema.json', 'workflow-event.schema.json', 'tool-check-result.schema.json', 'tool-execution-result.schema.json', 'tool-manifest.schema.json'];

function resolve(root, ...parts) {
  const relative = parts.join('/').replace(/\\/g, '/');
  const segments = relative.split('/');
  const track = path.basename(root);
  if (['backend', 'frontend'].includes(track)) {
    if (segments[0] === 'memory' && memoryTiers.includes(segments[1])) return path.join(REPO, 'engine', 'memory', segments[1], track, ...segments.slice(2));
    if (segments[0] === 'schemas' && sharedSchemas.includes(segments[1]) && track === 'backend') return path.join(REPO, 'engine', 'schemas', ...segments.slice(1));
    if (relative === 'config/retention-policy.yaml') return path.join(REPO, 'engine', 'config', 'retention-policy.yaml');
    if (relative.startsWith('knowledge/canonical/')) {
      if (track === 'frontend' && ['releases', 'appsettings', 'versions'].includes(segments[2])) return path.join(REPO, 'ingest', ...segments);
      if (track === 'backend' && segments[2] === 'appsettings') return path.join(REPO, 'ingest', 'knowledge', 'canonical', 'backend-appsettings', ...segments.slice(3));
    }
  }
  return path.join(root, ...parts);
}

module.exports = { resolve, REPO, sharedSchemas };