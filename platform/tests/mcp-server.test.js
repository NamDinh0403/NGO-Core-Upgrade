'use strict';
const assert = require('assert');
const mcpServer = require('../mcp-server');

async function runMcpTests() {
  console.log('Testing MCP Server Tools & Handlers...');

  // 1. Verify Tool Declarations
  assert(Array.isArray(mcpServer.TOOLS), 'TOOLS must be an array');
  assert(mcpServer.TOOLS.length >= 6, 'Must expose at least 6 MCP tools');
  assert(mcpServer.TOOLS.some(t => t.name === 'get_projects'));
  assert(mcpServer.TOOLS.some(t => t.name === 'get_release_notes'));
  assert(mcpServer.TOOLS.some(t => t.name === 'save_release_notes'));
  assert(mcpServer.TOOLS.some(t => t.name === 'run_preflight'));
  assert(mcpServer.TOOLS.some(t => t.name === 'verify_project'));
  assert(mcpServer.TOOLS.some(t => t.name === 'get_client_diff'));
  console.log('  PASS  01-mcp-tool-declarations');

  // 2. Test get_projects tool
  const projectsRes = await mcpServer.callTool('get_projects', {});
  assert(projectsRes && Array.isArray(projectsRes.content), 'Must return content envelope');
  assert(typeof projectsRes.content[0].text === 'string');
  console.log('  PASS  02-mcp-get-projects');

  // 3. Test save and get release notes
  const saveRes = await mcpServer.callTool('save_release_notes', {
    version: '9.9.99-mcp-test',
    content: '### Test Notes\n- Breaking change test for MCP',
  });
  assert(saveRes.content[0].text.includes('saved successfully'));

  const getNotesRes = await mcpServer.callTool('get_release_notes', {
    version: '9.9.99-mcp-test',
  });
  assert(getNotesRes.content[0].text.includes('Breaking change test for MCP'));
  console.log('  PASS  03-mcp-release-notes');

  console.log('\nMCP Server Test Matrix: All passed.');
}

if (require.main === module) {
  runMcpTests().catch((err) => {
    console.error('MCP test failure:', err);
    process.exit(1);
  });
}

module.exports = { runMcpTests };
