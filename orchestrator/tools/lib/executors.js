'use strict';
const path = require('path');

function capability(track, name) {
  const adapters = { backend: { configuration: path.resolve(__dirname, '..', '..', '..', 'backend', 'tools', 'configuration.js') } };
  if (!adapters[track] || !adapters[track][name]) throw new Error(`Unsupported executor capability: ${track}/${name}`);
  return require(adapters[track][name]);
}

module.exports = { capability };