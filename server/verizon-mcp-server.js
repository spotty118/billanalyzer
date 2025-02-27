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

// Rate limiting setup
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // limit each IP to 100 requests per windowMs
  requests: new Map()
};

// Rate limiting middleware
app.use((req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowStart = now - rateLimit.windowMs;

  // Clean up old requests
  if (rateLimit.requests.has(ip)) {
    rateLimit.requests.get(ip).requests = rateLimit.requests.get(ip).requests.filter(time => time > windowStart);
  }

  // Check rate limit
  if (rateLimit.requests.has(ip) && rateLimit.requests.get(ip).requests.length >= rateLimit.maxRequests) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }

  // Update request count
  if (!rateLimit.requests.has(ip)) {
    rateLimit.requests.set(ip, { requests: [] });
  }
  rateLimit.requests.get(ip).requests.push(now);

  next();
});

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

// Enhanced endpoint to scrape and analyze Verizon plans
app.get('/scrape-tags', async (req, res) => {
  console.log('Received request to /scrape-tags');
  const url = req.query.url || 'https://www.verizon.com/plans/unlimited/';
  
  try {
    console.log('Fetching URL:', url);

    // Use fetch_html tool to get the HTML content
    const fetchHtmlResult = await use_mcp_tool({
      serverName: "github.com/zcaceres/fetch-mcp",
      toolName: "fetch_html",
      arguments: { url: url }
    });

    if (fetchHtmlResult.error) {
      console.error('Error fetching HTML:', fetchHtmlResult.error);
      return res.status(500).json({ error: 'Failed to fetch HTML' });
    }

    // Use webpage-to-markdown tool to convert HTML to markdown
    const markdownResult = await use_mcp_tool({
      serverName: "github.com/zcaceres/markdownify-mcp",
      toolName: "webpage-to-markdown",
      arguments: { url: fetchHtmlResult.content }
    });

    if (markdownResult.error) {
      console.error('Error converting to markdown:', markdownResult.error);
      return res.status(500).json({ error: 'Failed to convert to markdown' });
    }

    // Use sequential thinking to analyze plans
    let sequentialAnalysis = [];
    
    // Step 1: Initial content analysis
    let analysisStep = await use_mcp_tool({
      serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
      toolName: "sequentialthinking",
      arguments: {
        thought: "Analyzing Verizon plans structure and format",
        thoughtNumber: 1,
        totalThoughts: 4,
        nextThoughtNeeded: true
      }
    });
    sequentialAnalysis.push(analysisStep.result);

    // Step 2: Extract plan features and pricing
    analysisStep = await use_mcp_tool({
      serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
      toolName: "sequentialthinking",
      arguments: {
        thought: "Extracting and categorizing plan features and pricing",
        thoughtNumber: 2,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        branchFromThought: 1
      }
    });
    sequentialAnalysis.push(analysisStep.result);

    // Step 3: Compare plans and identify benefits
    analysisStep = await use_mcp_tool({
      serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
      toolName: "sequentialthinking",
      arguments: {
        thought: "Comparing plans and identifying key benefits",
        thoughtNumber: 3,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        branchFromThought: 2
      }
    });
    sequentialAnalysis.push(analysisStep.result);

    // Step 4: Generate recommendations
    analysisStep = await use_mcp_tool({
      serverName: "github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
      toolName: "sequentialthinking",
      arguments: {
        thought: "Generating insights and recommendations for different user profiles",
        thoughtNumber: 4,
        totalThoughts: 4,
        nextThoughtNeeded: false,
        branchFromThought: 3
      }
    });
    sequentialAnalysis.push(analysisStep.result);

    // Extract insights from sequential analysis
    const insights = {
      structureAnalysis: sequentialAnalysis[0]?.result || {},
      features: sequentialAnalysis[1]?.result || {},
      comparison: sequentialAnalysis[2]?.result || {},
      recommendations: sequentialAnalysis[3]?.result || {}
    };

    // Parse plan details from markdown
    const plans = await parsePlansFromMarkdown(markdownResult.markdown);

    res.json({
      plans: plans,
      insights: insights,
      timestamp: new Date().toISOString(),
      url: url
    });
  } catch (error) {
    console.error('Error scraping tags:', error);
    res.status(500).json({ error: 'Failed to scrape tags' });
  }
});

async function parsePlansFromMarkdown(markdown) {
  // Helper function to extract clean text
  const cleanText = (text) => {
    return text
      .replace(/^\s*[•·-]\s*/, '') // Remove leading bullets
      .replace(/\s+/g, ' ')        // Normalize spaces
      .trim();
  };

  // Helper function to extract price
  const extractPrice = (text) => {
    const match = text.match(/\$\d+(?:\.\d{2})?/);
    return match ? match[0] : null;
  };

  const lines = markdown.split('\n');
  const plans = [];
  let currentPlan = null;

  for (const line of lines) {
    const cleanLine = cleanText(line);
    
    // Look for plan headers
    if (line.startsWith('##') && (line.toLowerCase().includes('plan') || line.toLowerCase().includes('unlimited'))) {
      if (currentPlan) {
        plans.push(currentPlan);
      }
      currentPlan = {
        name: cleanText(line.replace(/^#+\s*/, '')),
        features: [],
        perks: [],
        prices: {}
      };
    }
    // Extract prices
    else if (currentPlan && cleanLine.includes('$')) {
      const price = extractPrice(cleanLine);
      if (price) {
        if (cleanLine.toLowerCase().includes('/line')) {
          currentPlan.prices.perLine = price;
        } else if (cleanLine.toLowerCase().includes('/mo')) {
          currentPlan.prices.monthly = price;
        } else {
          currentPlan.prices.base = price;
        }
      }
    }
    // Extract features and perks
    else if (currentPlan && cleanLine.length > 0) {
      if (cleanLine.toLowerCase().includes('perk') || cleanLine.toLowerCase().includes('benefit')) {
        currentPlan.perks.push(cleanLine);
      } else {
        currentPlan.features.push(cleanLine);
      }
    }
  }

  // Add the last plan
  if (currentPlan) {
    plans.push(currentPlan);
  }

  return plans;
}

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

app.listen(port, () => {
  console.log(`Verizon MCP Server running on port ${port}`);
});
