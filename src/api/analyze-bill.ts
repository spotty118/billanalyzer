
import { server } from '@/api/server';
import { sampleBillAnalysis } from '@/data/sample-bill-analysis';

// Mock API endpoint for bill analysis
server.post('/api/analyze-bill', async (req, res) => {
  try {
    // In a real implementation, this would:
    // 1. Extract the file from the FormData
    // 2. Parse the file content (PDF or text)
    // 3. Process the bill data
    // 4. Return the structured analysis
    
    // For demo purposes, we'll just return sample data after a simulated delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return res.json(sampleBillAnalysis);
  } catch (error) {
    console.error('Error processing bill:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze bill',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
