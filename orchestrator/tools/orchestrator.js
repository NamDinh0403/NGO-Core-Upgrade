#!/usr/bin/env node
'use strict';
const engine = require('../../engine/tools/upgrade-engine');
if (require.main === module) engine.main();
module.exports = engine;
