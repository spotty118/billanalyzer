import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
dotenv.config();
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for the frontend
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins }));

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MCP Server process management
const mcpServers = new Map();

function startMcpServer(serverName) {
  const serverPath = serverName === 'verizon-data-server' 
    ? '/Users/justincornelius/Documents/Cline/MCP/verizon-data-server/build/index.js'
    : null;

  if (!serverPath) {
    throw new Error(`Unknown MCP server: ${serverName}`);
  }

  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';
  let responseResolve;
  let responsePromise = new Promise(resolve => {
    responseResolve = resolve;
  });

  // Handle server stdout
  serverProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    
    // Try to parse complete JSON responses
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      
      try {
        const response = JSON.parse(line);
        if (responseResolve) {
          responseResolve(response);
          responseResolve = undefined;
          responsePromise = new Promise(resolve => {
            responseResolve = resolve;
          });
        }
      } catch (e) {
        logger.error('Failed to parse MCP server response:', e);
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    logger.error(`MCP server error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    logger.info(`MCP server exited with code ${code}`);
    mcpServers.delete(serverName);
  });

  mcpServers.set(serverName, {
    process: serverProcess,
    getResponse: async () => responsePromise,
    sendRequest: (request) => {
      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      return responsePromise;
    }
  });

  return mcpServers.get(serverName);
}

// Handle MCP requests
app.all('/mcp/*', async (req, res) => {
  try {
    const originalUrl = req.url;
    logger.info(`Processing MCP request: ${originalUrl}`);

    // Extract server and tool names from URL
    const match = originalUrl.match(/^\/mcp\/([^/]+)\/([^/]+)$/);
    if (!match) {
      throw new Error('Invalid MCP request URL format');
    }

    const [, serverName, toolName] = match;
    logger.info(`MCP request for server: ${serverName}, tool: ${toolName}`);

    // Get or start MCP server
    let server = mcpServers.get(serverName);
    if (!server) {
      server = startMcpServer(serverName);
    }

    // Send request to MCP server
    const mcpResponse = await server.sendRequest({
      type: 'call_tool',
      params: {
        name: toolName,
        arguments: {}
      }
    });

    // Return MCP server response
    if (mcpResponse.content && mcpResponse.content[0] && mcpResponse.content[0].text) {
      res.json(JSON.parse(mcpResponse.content[0].text));
    } else {
      res.json(mcpResponse);
    }
  } catch (error) {
    logger.error('MCP proxy error:', error);
    res.status(500).json({
      error: 'Failed to process MCP request',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

let browser;

// Initialize browser on startup
async function initBrowser() {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  logger.info('Browser initialized');
}

initBrowser().catch(console.error);

// Helper function to retry page navigation
async function retryPageGoto(page, url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await page.goto(url, options);
    } catch (err) {
      logger.error(`Attempt ${i + 1} to navigate to ${url} failed: ${err.message}`);
      if (i === retries) throw err;
    }
  }
}

app.get('/api/grid', async (req, res) => {
  // ... (rest of the grid API code remains unchanged)
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message,
    timestamp: new Date().toISOString()
  });
});

// Cleanup MCP servers on shutdown
function cleanup() {
  logger.info('Shutting down MCP servers...');
  for (const [name, server] of mcpServers) {
    logger.info(`Stopping MCP server: ${name}`);
    server.process.kill();
  }
  mcpServers.clear();

  if (browser) {
    browser.close().then(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

app.listen(PORT, () => {
  logger.info(`Proxy server running on http://localhost:${PORT}`);
});
