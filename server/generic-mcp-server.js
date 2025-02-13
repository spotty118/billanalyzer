const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

// Cache simulation endpoint
app.post('/cache', (req, res) => {
  // Simulate caching: In a real scenario, you'd update your cache or perform caching logic
  const data = req.body;
  console.log('Caching data:', data);
  res.json({ message: "Data cached successfully", data });
});

// Performance endpoint simulation
app.get('/performance', (req, res) => {
  // Simulate a performance report with dummy data
  const report = {
    cpuUsage: (Math.random() * 100).toFixed(2) + '%',
    memoryUsage: (Math.random() * 100).toFixed(2) + '%',
    timestamp: new Date().toISOString()
  };
  res.json(report);
});

// Start the generic MCP server
app.listen(port, () => {
  console.log(`Generic MCP Server running on port ${port}`);
});
