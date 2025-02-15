const express = require('express');
const Apify = require('apify');

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to start an Apify actor
app.post('/start-task', async (req, res) => {
    const { actorId, input } = req.body;
    if (!actorId) {
        return res.status(400).json({ error: 'actorId is required in the request body.' });
    }
    try {
        // Call the Apify actor with the provided actor ID and input
        const run = await Apify.call(actorId, input || {});
        res.json({ runId: run.id, status: run.status });
    } catch (error) {
        console.error('Error calling Apify actor:', error);
        res.status(500).json({ error: error.message });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('MCP Server using Apify is running.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MCP Server is listening on port ${PORT}`);
});
