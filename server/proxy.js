import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
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
  try {
    logger.info('Proxy: Fetching data from vzdaily.com...');
    
    if (!browser) {
      logger.info('Reinitializing browser...');
      await initBrowser();
    }

    const page = await browser.newPage();
    
    // Set viewport to ensure all content is loaded
    await page.setViewport({ width: 1920, height: 1080 });
    
    logger.info('Navigating to page...');
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Log all requests and handle authentication
    page.on('request', request => {
      const url = request.url();
      logger.info('Request:', url);
      
      // Add authentication headers if needed
      const headers = {
        ...request.headers(),
        'Cookie': 'vzdaily_session=test',  // Add any required cookies
        'Authorization': 'Bearer test'      // Add any required auth tokens
      };
      
      request.continue({ headers });
    });

    // Handle any authentication redirects
    page.on('response', async response => {
      const status = response.status();
      const url = response.url();
      logger.info('Response:', url, status);
      
      if (status === 401 || status === 403) {
        logger.info('Authentication required - got status:', status);
        // Log response headers
        const headers = response.headers();
        logger.info('Response headers:', headers);
      }
    });

    // Log console messages
    page.on('console', msg => logger.info('Browser console:', msg.text()));

    logger.info('Navigating to page...');
    const response = await retryPageGoto(page, 'https://www.vzdaily.com/indirect-the-grid', {
      headers: {
        'Cookie': 'vzdaily_session=test',
        'Authorization': 'Bearer test'
      },
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });

    logger.info('Initial response status:', response.status());
    
    // Check if we got redirected
    const finalUrl = page.url();
    logger.info('Final URL:', finalUrl);

    if (response.status() === 404) {
      throw new Error('Page not found. The URL might have changed.');
    }

    // Wait for the page to be fully loaded
    await page.waitForFunction(() => document.readyState === 'complete');
    logger.info('Page loaded, waiting for content...');

    // Wait a bit for dynamic content using setTimeout
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (process.env.DEBUG_MODE === 'true') {
      try {
        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-page.png', fullPage: true });
        logger.info('Screenshot saved as debug-page.png');
      } catch (screenshotError) {
        logger.error('Failed to take screenshot:', screenshotError.message);
      }
    } else {
      logger.info('Debug mode disabled: Skipping screenshot.');
    }

    // Log the page structure with error handling
    const pageContent = await page.evaluate(() => {
      logger.info('Evaluating page content...');
      return {
        bodyHTML: document.body?.innerHTML || '',
        url: window.location.href,
        title: document.title,
        // Look for any elements that might contain our grid data
        gridElements: Array.from(document.querySelectorAll('table, [role="grid"], .grid, .table, [class*="grid"], [class*="table"], div')).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          role: el.getAttribute('role'),
          textPreview: el.textContent.substring(0, 100)
        }))
      };
    });

    logger.info('Found potential grid elements:', pageContent.gridElements);

    // Get the rendered HTML content and analyze structure
    const content = {
      html: pageContent.bodyHTML,
      text: pageContent.bodyHTML
    };

    // Log detailed structure analysis
    const structureAnalysis = await page.evaluate(() => {
      const tables = document.querySelectorAll('table, [role="grid"], [role="table"], .grid, .table');
      return Array.from(tables).map(table => ({
        tag: table.tagName,
        id: table.id,
        className: table.className,
        role: table.getAttribute('role'),
        structure: {
          rows: table.querySelectorAll('tr, [role="row"]').length,
          cells: table.querySelectorAll('td, th, [role="cell"], [role="gridcell"]').length,
          headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim()),
          firstRowText: table.querySelector('tr')?.textContent.trim()
        }
      }));
    });

    logger.info('Table structures found:', JSON.stringify(structureAnalysis, null, 2));

    await page.close();

    if (content) {
      logger.info('Content found, first 1000 chars:', content.text.substring(0, 1000));
      logger.info('Table analysis:', structureAnalysis);
      res.json({ 
        html: content.html, 
        text: content.text,
        tableAnalysis: structureAnalysis 
      });
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    logger.error('Proxy error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });

    // Send a more detailed error response
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch data from vzdaily.com',
      details: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString()
    });
  }
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

// Add graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  if (browser) {
    browser.close().then(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully.');
  if (browser) {
    browser.close().then(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

app.listen(PORT, () => {
  logger.info(`Proxy server running on http://localhost:${PORT}`);
});
