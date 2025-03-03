import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import bodyParser from 'body-parser';
import puppeteer from 'puppeteer';
import multer from 'multer';
import FormData from 'form-data';

// Utility function for launching browser with consistent configuration and error handling
const launchBrowser = async () => {
  let browser = null;
  let page = null;
  
  try {
    // Add content check function
    const checkContent = async (page, selectors, timeout = 5000) => {
      try {
      const content = await Promise.race([
        page.waitForSelector(selectors.join(', '), { timeout }),
        page.waitForFunction(
        (sels) => document.querySelectorAll(sels.join(', ')).length > 0,
        { timeout },
        selectors
        )
      ]);
      
      const contentCount = await page.evaluate((sels) => 
        document.querySelectorAll(sels.join(', ')).length,
        selectors
      );
      
      logger.info('Content check:', { contentCount, selectors });
      
      // Get content details for debugging
      const contentDetails = await page.evaluate((sels) => {
        const elements = document.querySelectorAll(sels.join(', '));
        return Array.from(elements).map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id,
        className: el.className,
        text: el.textContent?.trim().substring(0, 100),
        rect: el.getBoundingClientRect().toJSON()
        }));
      }, selectors);
      
      logger.info('Content details:', { contentDetails });
      
      // Check if content is visible
      const isVisible = await page.evaluate((sels) => {
        const elements = document.querySelectorAll(sels.join(', '));
        return Array.from(elements).some(el => {
        const rect = el.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        );
        });
      }, selectors);
      
      logger.info('Content visibility:', { isVisible });
      
      return contentCount > 0 && isVisible;
      } catch (error) {
      logger.error('Content check failed:', { error: error.message });
      return false;
      }
    };

    // Add navigation handling
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-dev-shm-usage',
        '--start-maximized',
        '--disable-gpu',
        '--disable-notifications',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--hide-scrollbars',
        '--enable-javascript',
        '--enable-automation',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--ignore-certificate-errors',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain'
      ],
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      timeout: 60000
    });

    page = await browser.newPage();
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Handle requests
    page.on('request', request => {
      const resourceType = request.resourceType();
      const url = request.url();
      
      // Allow main document and essential resources
      if (resourceType === 'document' || 
          resourceType === 'script' || 
          resourceType === 'xhr' || 
          resourceType === 'fetch' ||
          url.includes('verizon.com')) {
        const headers = {
          ...request.headers(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
          'DNT': '1',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        request.continue({ headers });
      } else {
        request.abort();
      }
    });

    // Log console messages and errors
    page.on('console', msg => logger.info('Browser console:', msg.text()));
    page.on('error', err => logger.error('Browser error:', err));
    page.on('pageerror', err => logger.error('Page error:', err));
    page.on('requestfailed', request => 
      logger.error('Request failed:', { 
        url: request.url(), 
        errorText: request.failure()?.errorText,
        headers: request.headers(),
        resourceType: request.resourceType()
      })
    );

    // Enhanced stealth mode
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
      Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
      window.chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {}
      };
      // Add more stealth
      delete navigator.__proto__.webdriver;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
      delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
    });

    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(60000);
    
    // Add response handling
    page.on('response', response => {
      logger.info('Response received:', { 
      url: response.url(),
      status: response.status(),
      headers: response.headers()
      });
    });

    // Add auto-scroll function with retry and content check
    const autoScroll = async (page, maxRetries = 3) => {
      const selectors = ['.vz-promo-card', '.gnav20-deal-card', '.c-card-deals'];
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('Starting auto-scroll attempt:', { attempt });
        const scrollResult = await page.evaluate(async () => {
        return await new Promise((resolve) => {
          let totalHeight = 0;
          let lastScroll = 0;
          let noChangeCount = 0;
          const distance = 100;
          const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (lastScroll === scrollHeight) {
            noChangeCount++;
          } else {
            noChangeCount = 0;
          }

          if (totalHeight >= scrollHeight || noChangeCount >= 5) {
            clearInterval(timer);
            resolve({ totalHeight, scrollHeight, noChangeCount });
          }
          lastScroll = scrollHeight;
          }, 100);
        });
        });
        logger.info('Auto-scroll completed successfully:', scrollResult);
        
        // Wait for any lazy-loaded content
        await page.waitForTimeout(1000);
        
        // Check if content is loaded
        const hasContent = await checkContent(page, selectors);
        if (!hasContent && attempt < maxRetries) {
        throw new Error('No content found after scroll');
        }
        
        break;
      } catch (error) {
        logger.error(`Auto-scroll attempt ${attempt} failed:`, { error: error.message });
        if (attempt === maxRetries) throw error;
        await page.waitForTimeout(1000 * attempt);
      }
      }
    };


    // Add navigation handling function with retry and logging
    const goto = async (url, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('Starting navigation attempt:', { attempt, url });
        await page.setDefaultNavigationTimeout(60000);
        await page.setDefaultTimeout(60000);

        const response = await page.goto(url, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 60000
        });

        if (!response.ok()) {
        throw new Error(`Failed to load page: ${response.status()} ${response.statusText()}`);
        }

        logger.info('Page loaded successfully:', { 
        status: response.status(),
        url: response.url()
        });

        // Wait for content to be visible
        await page.waitForSelector('body', { visible: true });
        
        // Scroll to load dynamic content
        await autoScroll(page);
        
        // Additional wait for any dynamic content
        await page.waitForTimeout(1000);
        
        return response;
      } catch (error) {
        logger.error(`Navigation attempt ${attempt} failed:`, { 
        url,
        error: error.message,
        stack: error.stack
        });
        if (attempt === maxRetries) throw error;
        await page.waitForTimeout(2000 * attempt);
      }
      }
      throw new Error(`Failed to navigate to ${url} after ${maxRetries} attempts`);
    };
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Upgrade-Insecure-Requests': '1',
      'DNT': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Connection': 'keep-alive'
    });

    // Enable JavaScript
    await page.setJavaScriptEnabled(true);

    return { browser, page, goto };
  } catch (error) {
    logger.error('Error launching browser:', { error: error.message, stack: error.stack });
    if (browser) {
      await browser.close().catch(err => logger.error('Error closing browser:', err));
    }
    throw error;
  }
};
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
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'];

// Ensure content type is properly set for MCP responses
app.use((req, res, next) => {
  res.type('application/json');
  next();
});

app.use(cors({ origin: allowedOrigins }));

// Add body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Handle bill analysis through proxy
app.post('/api/analyze-bill', upload.single('file'), async (req, res) => {
  try {
    logger.info('Received bill analysis request');
    
    if (!req.file) {
      logger.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Forward to the Verizon MCP server
    const server = mcpServers.get('verizon') || await startMcpServer('verizon');
    
    if (!server || !server.isReady()) {
      throw new Error('Verizon MCP server not ready');
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: 'application/pdf'
    });

    const response = await fetch('http://localhost:4000/analyze-bill', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Bill analysis failed: ${response.statusText}`);
    }

    const result = await response.json();
    // Ensure we properly format the analysis string with the summary
    if (result.analysis) {
      res.json({
        data: {
          analysis: result.analysis.summary
        }
      });
    } else {
      throw new Error('Invalid analysis result format');
    }
  } catch (error) {
    logger.error('Bill analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze bill',
      message: error.message
    });
  }
});

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

// Update MCP server startup function
function startMcpServer(serverName) {
  logger.info('Starting scraping server:', { serverName });

  const server = {
    isReady: () => true,
    sendRequest: async (request) => {
      logger.info('Processing request:', { serverName, request });
        let browser = null;
        let page = null;
        
        try {
        if (request.params.name === 'fetch_promotions') {
            const { browser: newBrowser, page: newPage, goto } = await launchBrowser();
            browser = newBrowser;
            page = newPage;

            logger.info('Navigating to Verizon deals page...');
            await goto('https://www.verizon.com/deals/');


          logger.info('Waiting for content to load...');
          const selector = await Promise.race([
            page.waitForSelector('.vz-promo-card', { timeout: 5000 }).then(() => '.vz-promo-card'),
            page.waitForSelector('.gnav20-deal-card', { timeout: 5000 }).then(() => '.gnav20-deal-card'),
            page.waitForSelector('.c-card-deals', { timeout: 5000 }).then(() => '.c-card-deals')
          ]);

          if (!selector) {
            throw new Error('No promotion elements found on page');
          }

          // Scroll to load dynamic content
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await page.waitForTimeout(2000);

          logger.info('Extracting promotions...');
          const content = await page.evaluate(() => {
            const promotions = [];
            const cards = document.querySelectorAll('.vz-promo-card, .gnav20-deal-card, .c-card-deals');
            
            cards.forEach((card, index) => {
              promotions.push({
                id: card.id || String(index),
                title: card.querySelector('.vz-promo-title, .gnav20-deal-title')?.textContent?.trim() || '',
                description: card.querySelector('.vz-promo-description, .gnav20-deal-description')?.textContent?.trim() || '',
                terms: card.querySelector('.vz-promo-terms, .gnav20-deal-terms')?.textContent?.trim() || ''
              });
            });
            
            return promotions;
          });

          if (!content.length) {
            throw new Error('No promotions found on page');
          }

          logger.info('Successfully extracted promotions:', { count: content.length });
          return { content: [{ text: JSON.stringify(content) }] };
        }
        
        return { content: [{ text: '[]' }] };
      } catch (error) {
        logger.error('Error processing request:', { error: error.message, stack: error.stack });
        throw error;
      } finally {
        if (browser) {
          await browser.close().catch(err => logger.error('Error closing browser:', err));
        }
      }
    }
  };

  mcpServers.set(serverName, server);
  return Promise.resolve(server);
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
      try {
        server = await startMcpServer(serverName);
      } catch (error) {
        logger.error('Failed to start MCP server:', { error: error.message });
        throw new Error('Failed to start MCP server: ' + error.message);
      }
    } else if (!server.isReady()) {
      logger.info('Server exists but not ready, restarting...');
      try {
        mcpServers.get(serverName)?.process?.kill();
        mcpServers.delete(serverName);
        logger.info('Starting fresh server instance');
        server = await startMcpServer(serverName);
      } catch (error) {
        logger.error('Failed to restart MCP server:', { error: error.message });
        throw new Error('Failed to restart MCP server: ' + error.message);
      }
    }
    
    if (!server || !server.isReady()) {
      logger.error('Server not ready after startup');
      throw new Error('MCP server not ready');
    }

    const mcpResponse = await server.sendRequest({
      type: 'call_tool',
      params: {
        name: toolName,
        arguments: req.method === 'GET' ? req.query : req.body
      }
    });

    logger.info('Processing response');

    if (mcpResponse.content?.[0]?.text) {
      try {
        const parsedResponse = JSON.parse(mcpResponse.content[0].text);
        return res.json(parsedResponse);
      } catch (e) {
        logger.error('Parse error, sending raw text:', { error: e.message });
        return res.send(mcpResponse.content[0].text);
      }
    }

    res.json(mcpResponse);
  } catch (error) {
    logger.error('Request error:', { error: error.message, stack: error.stack });
    const statusCode = error.message.includes('not ready') ? 503 : 500;
    const errorResponse = {
      error: statusCode === 503 ? 'Service Unavailable' : 'Internal Server Error',
      message: error.message,
      retry: statusCode === 503,
      code: statusCode === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR'
    };
    logger.error('Sending error response:', errorResponse);
    res.status(statusCode).json(errorResponse);
  }
});

// Add grid API endpoint
app.get('/api/grid', async (req, res) => {
  try {
    logger.info('Starting grid scraping...');
    const { browser, page } = await launchBrowser();
    
    try {
      // Navigate to the plans page
      await page.goto('https://www.verizon.com/plans/', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for plan elements
      await Promise.race([
        page.waitForSelector('.plan-card', { timeout: 5000 }).catch(() => null),
        page.waitForSelector('.vz-plan-card', { timeout: 5000 }).catch(() => null),
        page.waitForSelector('.plan-pricing-table', { timeout: 5000 }).catch(() => null)
      ]);

      // Scroll to load dynamic content
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Additional wait for dynamic content
      await page.waitForTimeout(2000);

      // Get the page content and structure
      const html = await page.content();
      
      // Extract plan details
      const planAnalysis = await page.evaluate(() => {
        const elements = document.querySelectorAll('.plan-card, .vz-plan-card, .plan-pricing-table tr');
        return Array.from(elements).map(el => ({
          tag: el.tagName.toLowerCase(),
          id: el.id,
          className: el.className,
          structure: {
            name: el.querySelector('.plan-name, .plan-title')?.textContent?.trim() || '',
            price: el.querySelector('.price, .base-price')?.textContent?.trim() || '',
            features: Array.from(el.querySelectorAll('.features li, .plan-features li'))
              .map(feature => feature.textContent?.trim() || '')
          }
        }));
      });

      res.json({ html, planAnalysis });
    } finally {
      if (browser) {
        await browser.close().catch(err => logger.error('Error closing browser:', err));
      }
    }
  } catch (error) {
    logger.error('Grid scraping error:', error);
    res.status(500).json({ 
      error: 'Failed to scrape grid',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { 
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    params: req.params,
    query: req.query,
    body: req.body
  });
  
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    error: statusCode === 503 ? 'Service Unavailable' : 'Internal Server Error',
    message: err.message,
    retry: statusCode === 503,
    code: statusCode === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR'
  };
  
  res.status(statusCode).json(errorResponse);
});

// Add uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', { 
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Add unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection:', { 
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
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

export { app };
