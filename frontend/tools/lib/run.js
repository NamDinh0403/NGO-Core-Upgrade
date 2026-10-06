'use strict';
module.exports = require('../../../engine/tools/lib/artifacts').create({
  root: require('./core').ROOT,
  requiredDocItems: require('./state-machine').REQUIRED_DOC_ITEMS,
  defaults: {
    status: 'IN_PROGRESS', currentPhase: 'REQUEST', currentSkill: 'validate-local-repositories',
    clientPath: null, corePath: null, sourceVersion: null, targetVersion: null,
    coreSourceCommit: null, coreTargetCommit: null, doctorStatus: null, planStatus: null,
    auditStatus: null, packageAlignmentStatus: null, semanticCoverage: null,
    requirementMappingStatus: null, buildStatus: null, testStatus: null, auditPassed: false,
  },
});