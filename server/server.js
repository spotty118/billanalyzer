
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PDFParser from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Analyze bill endpoint
app.post('/api/analyze-bill', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          message: 'No file uploaded',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    // Parse PDF file
    const data = await PDFParser(req.file.buffer);
    
    // Extract text content
    const text = data.text;
    console.log('Extracted text:', text);

    // Mock analysis result for now - you can enhance this with actual PDF parsing logic
    const analysis = {
      totalAmount: 150.00,
      accountNumber: "123456789",
      billingPeriod: "Jan 1 - Jan 31, 2024",
      charges: [
        {
          description: "Monthly Service",
          amount: 120.00,
          type: "service"
        },
        {
          description: "Taxes and Fees",
          amount: 30.00,
          type: "tax"
        }
      ],
      lineItems: [
        {
          description: "Line 1",
          amount: 75.00,
          type: "mobile"
        },
        {
          description: "Line 2",
          amount: 45.00,
          type: "mobile"
        }
      ],
      subtotals: {
        lineItems: 120.00,
        otherCharges: 30.00
      },
      summary: "Total charges for this billing period"
    };

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing bill:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Error analyzing bill',
        code: 'PROCESSING_ERROR'
      }
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
