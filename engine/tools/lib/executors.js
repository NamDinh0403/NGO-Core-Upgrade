'use strict';
const path = require('path');

function capability(track, name) {
  const adapters = { backend: { configuration: path.resolve(__dirname, '..', '..', '..', 'backend', 'tools', 'configuration.js') } };
  if (!adapters[track] || !adapters[track][name]) throw new Error(`Unsupported executor capability: ${track}/${name}`);
  return require(adapters[track][name]);
}

function executor(track) {
  if (!['backend', 'frontend'].includes(track)) throw new Error('Unsupported executor track');
  return require(path.resolve(__dirname, '..', '..', '..', track, 'tools', 'executor'));
}

module.exports = { capability, executor };