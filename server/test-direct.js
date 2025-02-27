#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billText = fs.readFileSync(path.join(__dirname, '..', 'sample-bill.txt'), 'utf8');

// Path to our MCP server
const serverPath = '/Users/justincornelius/Documents/Cline/MCP/bill-analysis-server/dist/index.js';

async function callTool(toolName) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'call_tool',
      params: {
        name: toolName,
        arguments: {
          billText,
          accountHistory: {
            previousBills: []
          }
        }
      }
    };

    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', process.stderr]
    });

    server.stdin.write(JSON.stringify(request));
    server.stdin.end();

    let data = '';
    server.stdout.on('data', chunk => {
      data += chunk;
    });

    server.stdout.on('end', () => {
      try {
        const response = JSON.parse(data);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });

    server.on('error', reject);
  });
}

async function runTests() {
  try {
    console.log('\n=== Testing analyze_usage_patterns ===');
    const usagePatterns = await callTool('analyze_usage_patterns');
    console.log(JSON.stringify(usagePatterns, null, 2));

    console.log('\n=== Testing analyze_costs ===');
    const costs = await callTool('analyze_costs');
    console.log(JSON.stringify(costs, null, 2));

    console.log('\n=== Testing recommend_plan ===');
    const recommendation = await callTool('recommend_plan');
    console.log(JSON.stringify(recommendation, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTests();
