#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const billText = fs.readFileSync(path.join(__dirname, '..', 'sample-bill.txt'), 'utf8');

// Simulate MCP JSON-RPC request for analyze_usage_patterns
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'call_tool',
  params: {
    name: 'analyze_usage_patterns',
    arguments: {
      billText,
      accountHistory: {
        previousBills: []
      }
    }
  }
};

// Write request to stdout and end
process.stdout.write(JSON.stringify(request));
process.stdout.end();

// Listen for response on stdin
process.stdin.setEncoding('utf8');
let data = '';

process.stdin.on('data', chunk => {
  data += chunk;
});

process.stdin.on('end', () => {
  try {
    const response = JSON.parse(data);
    console.error('Analysis Result:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error parsing response:', error);
    console.error('Raw response:', data);
  }
});
