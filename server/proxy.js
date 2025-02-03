import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import bodyParser from 'body-parser';
dotenv.config();
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for the frontend
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins }));

// Add body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request:', { 
    method: req.method, 
    url: req.url,
    originalUrl: req.originalUrl
  });
  next();
});

// MCP Server process management
const mcpServers = new Map();

function startMcpServer(serverName) {
  const serverPath = '/Users/justincornelius/Documents/Cline/MCP/verizon-data-server/build/index.js';
  logger.info('Starting MCP server:', { serverName, serverPath });

  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
    detached: false
  });

  let isReady = false;
  let buffer = '';
  let pendingRequests = new Map();
  let requestId = 0;

  serverProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      
      if (!line.trim()) continue;

      // Handle startup message
      if (line.includes('running on stdio')) {
        logger.info('MCP server ready:', { serverName });
        isReady = true;
        continue;
      }

      try {
        const response = JSON.parse(line);
        logger.info('Received response:', { response });
        
        // Find and resolve the oldest pending request
        if (pendingRequests.size > 0) {
          const [oldestId, oldestResolve] = Array.from(pendingRequests.entries())[0];
          oldestResolve(response);
          pendingRequests.delete(oldestId);
          logger.info('Resolved request:', { requestId: oldestId });
        }
      } catch (e) {
        logger.error('Failed to parse response:', { error: e.message, line });
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    logger.error('MCP server error:', { error: data.toString() });
    // Don't fail on stderr output as it might be console.error logs
  });

  serverProcess.on('error', (error) => {
    logger.error('MCP server process error:', { error: error.message });
    mcpServers.delete(serverName);
  });

  serverProcess.on('exit', (code, signal) => {
    logger.error('MCP server exited:', { code, signal });
    mcpServers.delete(serverName);
  });

  serverProcess.on('close', (code, signal) => {
    logger.error('MCP server closed:', { code, signal });
    mcpServers.delete(serverName);
  });

  const server = {
    process: serverProcess,
    isReady: () => isReady,
    sendRequest: async (request) => {
      const id = requestId++;
      logger.info('Sending request:', { id, request });
      
      const responsePromise = new Promise((resolve, reject) => {
        pendingRequests.set(id, resolve);
        
        // Set timeout to prevent hanging
        setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.delete(id);
            reject(new Error('Request timeout'));
          }
        }, 30000); // Increase timeout to 30 seconds
      });

      serverProcess.stdin.write(JSON.stringify(request) + '\n');
      return responsePromise;
    }
  };

  mcpServers.set(serverName, server);
  
  // Wait for server to be ready
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 30000); // Increase startup timeout to match request timeout

    const checkReady = setInterval(() => {
      if (isReady) {
        clearTimeout(timeout);
        clearInterval(checkReady);
        resolve(server);
      }
    }, 100);
  });
}

// Handle MCP requests
app.all(['/api/mcp/:server/:tool', '/mcp/:server/:tool'], async (req, res) => {
  try {
    // Log complete request details
    logger.info('Received MCP request:', {
      method: req.method,
      path: req.path,
      params: req.params,
      body: req.body
    });
    const { server: serverName, tool: toolName } = req.params;
    logger.info('Processing request:', { serverName, toolName });

    let server = mcpServers.get(serverName);
    if (!server) {
      logger.info('Starting new server instance');
      server = await startMcpServer(serverName);
    } else if (!server.isReady()) {
      logger.info('Server exists but not ready, restarting...');
      mcpServers.get(serverName)?.process?.kill();
      mcpServers.delete(serverName);
      logger.info('Starting fresh server instance');
      server = await startMcpServer(serverName);
    }

    const mcpResponse = await server.sendRequest({
      type: 'call_tool',
      params: {
        name: toolName,
        arguments: req.method === 'GET' ? {} : req.body
      }
    });

    logger.info('Processing response');

    if (mcpResponse.content?.[0]?.text) {
      try {
        const parsedResponse = JSON.parse(mcpResponse.content[0].text);
        return res.json(parsedResponse);
      } catch (e) {
        logger.error('Parse error:', { error: e.message });
        throw new Error('Invalid response format from MCP server');
      }
    }

    res.json(mcpResponse);
  } catch (error) {
    logger.error('Request error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.message });
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message
  });
});

// Cleanup on shutdown
function cleanup() {
  logger.info('Shutting down...');
  mcpServers.forEach((server, name) => {
    logger.info('Stopping server:', { name });
    server.process.kill();
  });
  process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

app.listen(PORT, () => {
  logger.info('Server running:', { port: PORT });
});
