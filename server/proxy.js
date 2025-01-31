import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

// Enable CORS for the frontend
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'] // Allow common dev server ports
}));

// Proxy endpoint for the Grid
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

let browser;

// Initialize browser on startup
async function initBrowser() {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  console.log('Browser initialized');
}

initBrowser().catch(console.error);

app.get('/api/grid', async (req, res) => {
  try {
    console.log('Proxy: Fetching data from vzdaily.com...');
    
    if (!browser) {
      console.log('Reinitializing browser...');
      await initBrowser();
    }

    const page = await browser.newPage();
    
    // Set viewport to ensure all content is loaded
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Navigating to page...');
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Log all requests and handle authentication
    page.on('request', request => {
      const url = request.url();
      console.log('Request:', url);
      
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
      console.log('Response:', url, status);
      
      if (status === 401 || status === 403) {
        console.log('Authentication required - got status:', status);
        // Log response headers
        const headers = response.headers();
        console.log('Response headers:', headers);
      }
    });

    // Log all responses
    page.on('response', response => {
      console.log('Response:', response.url(), response.status());
    });

    // Log console messages
    page.on('console', msg => console.log('Browser console:', msg.text()));

    console.log('Navigating to page...');
    const response = await page.goto('https://www.vzdaily.com/indirect-the-grid', {
      headers: {
        'Cookie': 'vzdaily_session=test',
        'Authorization': 'Bearer test'
      },
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });

    console.log('Initial response status:', response.status());
    
    // Check if we got redirected
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);

    if (response.status() === 404) {
      throw new Error('Page not found. The URL might have changed.');
    }

    // Wait for the page to be fully loaded
    await page.waitForFunction(() => document.readyState === 'complete');
    console.log('Page loaded, waiting for content...');

    // Wait a bit for dynamic content using setTimeout
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'debug-page.png', fullPage: true });
      console.log('Screenshot saved as debug-page.png');
    } catch (screenshotError) {
      console.error('Failed to take screenshot:', screenshotError.message);
    }

    // Log the page structure with error handling
    const pageContent = await page.evaluate(() => {
      console.log('Evaluating page content...');
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

    console.log('Found potential grid elements:', pageContent.gridElements);

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

    console.log('Table structures found:', JSON.stringify(structureAnalysis, null, 2));

    await page.close();

    if (content) {
      console.log('Content found, first 1000 chars:', content.text.substring(0, 1000));
      console.log('Table analysis:', structureAnalysis);
      res.json({ 
        html: content.html, 
        text: content.text,
        tableAnalysis: structureAnalysis 
      });
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    console.error('Proxy error:', {
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
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
