'use strict';
/*
 * AppSettings inventory and mapper (IAppSettingsInventory + mapper).
 * Discovers backend configuration surfaces (API / WebJob / Tool / deployment)
 * and maps canonical AppSettings requirements onto them: identifies owning
 * process, file section/key and Azure key, preserves existing client values,
 * prevents secret leakage, and assigns manual deployment ownership.
 * Dependency-free, Node 14+.
 */
module.exports = require('../../../engine/tools/lib/executors').capability('backend', 'configuration');
