'use strict';
/*
 * Model Context Protocol (MCP) Server for NGO Core Upgrade.
 *
 * Implements standard JSON-RPC 2.0 stdio MCP transport (Node 14+, dependency-free).
 * Exposes deterministic workspace inspection, preflight, release notes, verification,
 * and review tools to GitHub Copilot CLI, Antigravity, and other MCP-enabled agents.
 */

const readline = require('readline');
const path = require('path');
const fs = require('fs');

const preflightLib = require('./preflight');
const verifierLib = require('./verifier');
const reviewerLib = require('./reviewer');
const releaseNotesLib = require('./release-notes');
const discoveryLib = require('./discovery');

const SERVER_NAME = 'ngo-core-upgrade';
const SERVER_VERSION = '1.0.0';
const PROTOCOL_VERSION = '2024-11-05';

// Define available MCP tools
const TOOLS = [
  {
    name: 'get_projects',
    description: 'Discover client projects in the workspace, their installed Core versions, and .NET target frameworks.',
    inputSchema: {
      type: 'object',
      properties: {
        searchDir: {
          type: 'string',
          description: 'Optional root directory to search for client workspaces. Defaults to parent directory.',
        },
      },
    },
  },
  {
    name: 'get_release_notes',
    description: 'Retrieve team release notes, migration guides, breaking changes, and API adjustments for a target NGO Core version.',
    inputSchema: {
      type: 'object',
      properties: {
        version: {
          type: 'string',
          description: 'Target NGO Core version (e.g. 9.4.1).',
        },
      },
      required: ['version'],
    },
  },
  {
    name: 'save_release_notes',
    description: 'Save or update team release/migration notes (from OneNote or markdown) for a target NGO Core version.',
    inputSchema: {
      type: 'object',
      properties: {
        version: {
          type: 'string',
          description: 'Target NGO Core version (e.g. 9.4.1).',
        },
        content: {
          type: 'string',
          description: 'Markdown formatted notes, breaking changes, API renames, or configuration instructions.',
        },
      },
      required: ['version', 'content'],
    },
  },
  {
    name: 'run_preflight',
    description: 'Run deterministic preflight checks (package availability, working tree safety, TargetFramework compatibility) for a client repository.',
    inputSchema: {
      type: 'object',
      properties: {
        clientPath: {
          type: 'string',
          description: 'Absolute filesystem path to the client project.',
        },
        targetVersion: {
          type: 'string',
          description: 'Target NGO Core version to upgrade to (e.g. 9.4.1).',
        },
        tracks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tracks to check: ["backend", "frontend"]. Defaults to both.',
        },
      },
      required: ['clientPath', 'targetVersion'],
    },
  },
  {
    name: 'verify_project',
    description: 'Run deterministic local compilation, build, and test checks (dotnet build/test, npm build/test) without LLM dependency.',
    inputSchema: {
      type: 'object',
      properties: {
        clientPath: {
          type: 'string',
          description: 'Absolute filesystem path to the client project.',
        },
        targetVersion: {
          type: 'string',
          description: 'Target NGO Core version.',
        },
        tracks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tracks to verify: ["backend", "frontend"]. Defaults to both.',
        },
        forceRegression: {
          type: 'boolean',
          description: 'Whether to force full test regression instead of targeted fingerprint checks.',
        },
      },
      required: ['clientPath', 'targetVersion'],
    },
  },
  {
    name: 'get_client_diff',
    description: 'Inspect current Git diff, modified files, and working tree cleanliness for a client repository.',
    inputSchema: {
      type: 'object',
      properties: {
        clientPath: {
          type: 'string',
          description: 'Absolute filesystem path to the client repository.',
        },
      },
      required: ['clientPath'],
    },
  },
];

/**
 * Dispatch tool executions.
 */
async function callTool(name, args) {
  args = args || {};

  switch (name) {
    case 'get_projects': {
      const searchDir = args.searchDir || path.resolve(__dirname, '..', '..');
      const projects = preflightLib.discoverProjects(searchDir);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(projects, null, 2),
          },
        ],
      };
    }

    case 'get_release_notes': {
      const notes = releaseNotesLib.getReleaseNotes(args.version);
      return {
        content: [
          {
            type: 'text',
            text: notes && notes.exists
              ? `Release Notes for NGO Core ${notes.version} (Source: ${notes.source}):\n\n${notes.content}`
              : `No release notes found for NGO Core ${args.version}.`,
          },
        ],
      };
    }

    case 'save_release_notes': {
      const result = releaseNotesLib.saveReleaseNotes(args.version, args.content, { source: 'mcp_agent' });
      return {
        content: [
          {
            type: 'text',
            text: `Release notes saved successfully for NGO Core ${result.version} (${result.contentLength} characters).`,
          },
        ],
      };
    }

    case 'run_preflight': {
      const result = preflightLib.runPreflight({
        clientPath: args.clientPath,
        targetVersion: args.targetVersion,
        tracks: args.tracks || ['backend', 'frontend'],
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: result.ok,
              status: result.status,
              safetyDecision: result.safetyDecision,
              decisionReason: result.decisionReason,
              targetFramework: result.targetFramework,
              requiresFrameworkUpgrade: result.requiresFrameworkUpgrade,
              blockers: result.blockers,
              warnings: result.warnings,
              checksSummary: result.checks.map(c => `[${c.status}] ${c.name}: ${c.sanitizedOutput || c.details || 'OK'}`),
            }, null, 2),
          },
        ],
      };
    }

    case 'verify_project': {
      const verification = verifierLib.verify({
        clientPath: args.clientPath,
        targetVersion: args.targetVersion,
        tracks: args.tracks || ['backend', 'frontend'],
        forceRegression: args.forceRegression || false,
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: verification.ok,
              passedChecks: verification.passedChecks,
              failedChecks: verification.failedChecks,
              checks: verification.checks.map(c => ({
                name: c.name,
                status: c.status,
                durationMs: c.durationMs,
                details: c.details,
              })),
            }, null, 2),
          },
        ],
      };
    }

    case 'get_client_diff': {
      const diff = reviewerLib.getGitDiff(args.clientPath);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              hasChanges: diff.hasChanges,
              stat: diff.stat,
              patch: diff.patch ? diff.patch.slice(0, 10000) : '',
            }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Send JSON-RPC response to stdout.
 */
function sendResponse(id, result, error) {
  const payload = {
    jsonrpc: '2.0',
    id,
  };
  if (error) {
    payload.error = {
      code: error.code || -32603,
      message: error.message || 'Internal error',
      data: error.data,
    };
  } else {
    payload.result = result;
  }
  process.stdout.write(JSON.stringify(payload) + '\n');
}

/**
 * Start the stdio JSON-RPC MCP server.
 */
function startMcpServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let req;
    try {
      req = JSON.parse(trimmed);
    } catch (err) {
      sendResponse(null, null, { code: -32700, message: `Parse error: ${err.message}` });
      return;
    }

    const { id, method, params } = req;

    // Handle notifications (no id)
    if (id === undefined || id === null) {
      if (method === 'notifications/initialized') {
        // Client confirmed initialization
      }
      return;
    }

    try {
      switch (method) {
        case 'initialize':
          sendResponse(id, {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: SERVER_NAME,
              version: SERVER_VERSION,
            },
          });
          break;

        case 'ping':
          sendResponse(id, {});
          break;

        case 'tools/list':
          sendResponse(id, {
            tools: TOOLS,
          });
          break;

        case 'tools/call': {
          if (!params || !params.name) {
            sendResponse(id, null, { code: -32602, message: 'Tool name is required' });
            return;
          }
          const result = await callTool(params.name, params.arguments);
          sendResponse(id, result);
          break;
        }

        default:
          sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
          break;
      }
    } catch (err) {
      sendResponse(id, null, { code: -32603, message: err.message, data: err.stack });
    }
  });

  process.stderr.write(`[MCP] ${SERVER_NAME} v${SERVER_VERSION} listening on stdio (JSON-RPC 2.0)\n`);
}

if (require.main === module) {
  startMcpServer();
}

module.exports = {
  TOOLS,
  callTool,
  startMcpServer,
};
