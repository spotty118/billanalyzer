import express from 'express';
import multer from 'multer';
import { extractVerizonBillData } from './bill-parser.js';

const app = express();
const port = process.env.PORT || 4000; // Default port for Verizon MCP Server

// Configure multer for handling file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

app.use(express.json());

// Endpoint to simulate Verizon plans lookup
app.get('/plans', (req, res) => {
  // Simulated plans data; in a real-world scenario, this data might be retrieved from a database or external API
  const plans = [
    { id: 1, name: 'Basic Plan', minutes: 500, data: '2GB', price: '$40' },
    { id: 2, name: 'Premium Plan', minutes: 'Unlimited', data: '10GB', price: '$70' },
    { id: 3, name: 'Unlimited Plan', minutes: 'Unlimited', data: 'Unlimited', price: '$90' }
  ];
  res.json(plans);
});

// Endpoint to simulate price lookup for a specific plan
app.get('/price', (req, res) => {
  const planId = parseInt(req.query.plan, 10);
  // Dummy data for price details based on plan id
  const pricingDetails = {
    1: { price: '$40', details: 'Basic plan pricing details' },
    2: { price: '$70', details: 'Premium plan pricing details' },
    3: { price: '$90', details: 'Unlimited plan pricing details' }
  };

  if (pricingDetails[planId]) {
    res.json(pricingDetails[planId]);
  } else {
    res.status(404).json({ error: 'Plan not found' });
  }
});

// Start the Verizon catered MCP server
// Endpoint to scrape HTML tags from Verizon's plan page
app.get('/scrape-tags', async (req, res) => {
  console.log('Received request to /scrape-tags');
  const url = req.query.url || 'https://www.verizon.com/plans/unlimited/';
  try {
    console.log('Fetching URL:', url);

    // Use fetch_html tool to get the HTML content
    const fetchHtmlResult = await fetch_html(url);
    if (fetchHtmlResult.error) {
      console.error('Error fetching HTML:', fetchHtmlResult.error);
      return res.status(500).json({ error: 'Failed to fetch HTML' });
    }
    const html = fetchHtmlResult.content;

    // Use webpage-to-markdown tool to convert the HTML to markdown
    const webpageToMarkdownResult = await webpage_to_markdown(html);
    if (webpageToMarkdownResult.error) {
      console.error('Error converting to markdown:', webpageToMarkdownResult.error);
      return res.status(500).json({ error: 'Failed to convert to markdown' });
    }
    const markdown = webpageToMarkdownResult.markdown;

    res.json({
      markdown: markdown,
      timestamp: new Date().toISOString(),
      url: url
    });
  } catch (error) {
    console.error('Error scraping tags:', error);
    res.status(500).json({ error: 'Failed to scrape tags' });
  }
});

async function fetch_html(url) {
  try {
    // Use fetch_html tool from fetch-mcp server
    const result = await use_mcp_tool({
      serverName: "github.com/zcaceres/fetch-mcp",
      toolName: "fetch_html",
      arguments: { url: url },
    });

    if (result.error) {
      return { error: result.error };
    }
    return { content: result.content };
  } catch (error) {
    console.error("Error calling fetch_html tool:", error);
    return { error: error.message };
  }
}

async function webpage_to_markdown(html) {
  try {
    // Use webpage-to-markdown tool from markdownify-mcp server
    const result = await use_mcp_tool({
      serverName: "github.com/zcaceres/markdownify-mcp",
      toolName: "webpage-to-markdown",
      arguments: { url: html },
    });

    if (result.error) {
      return { error: result.error };
    }
    return { markdown: result.markdown };
  } catch (error) {
    console.error("Error calling webpage_to_markdown tool:", error);
    return { error: error.message };
  }
}

async function use_mcp_tool({ serverName, toolName, arguments: args }) {
  try {
    const result = await fetch(`http://localhost:1337/tool/${toolName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        serverName: serverName,
        toolName: toolName,
        arguments: args,
      }),
    });

    const data = await result.json();
    if (data.error) {
      return { error: data.error };
    }
    return data;
  } catch (error) {
    console.error(`Error calling ${toolName} tool on ${serverName}:`, error);
    return { error: error.message };
  }
}

app.listen(port, () => {
  console.log(`Verizon MCP Server running on port ${port}`);
});

// Endpoint for bill analysis
app.post('/analyze-bill', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.file.buffer) {
      return res.status(400).json({ error: 'Invalid file data' });
    }

    const analysis = await extractVerizonBillData(req.file.buffer);
    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing bill:', error);
    res.status(500).json({ error: 'Failed to analyze bill' });
  }
});
