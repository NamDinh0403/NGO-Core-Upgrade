'use strict';
/*
 * Release knowledge store (IReleaseKnowledgeStore).
 * Loads canonical structured release requirements, reusable migrations,
 * AppSettings requirements, and the version manifest from knowledge/canonical/.
 * Read-only; never loads raw release notes. Dependency-free, Node 14+.
 */
const core = require('./core');
module.exports = require('../../../orchestrator/tools/lib/knowledge').createStore(core);
