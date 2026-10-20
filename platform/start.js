#!/usr/bin/env node
'use strict';
/*
 * Start script for the Local UI-Driven Upgrade Platform.
 *
 * Usage:
 *   node platform/start.js [port]
 */

const server = require('./server');
const port = parseInt(process.argv[2] || process.env.PORT || '3800', 10);
server.startServer(port);
