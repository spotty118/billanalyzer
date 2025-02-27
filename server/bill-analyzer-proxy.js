import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { extractVerizonBillData } from './bill-parser.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Endpoint to analyze a Verizon bill PDF
 * POST /api/analyze-bill
 */
router.post('/analyze-bill', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    console.log(`Processing bill file: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Use the enhanced bill parser
    const result = await extractVerizonBillData(req.file.buffer);
    
    // Format the response to match the frontend's expected structure
    const response = {
      totalAmount: result.totalAmount || 0,
      accountNumber: result.accountNumber || 'Unknown',
      billingPeriod: result.billingPeriod || 'Unknown',
      charges: result.charges.map(charge => ({
        description: charge.description,
        amount: charge.amount,
        type: charge.type
      })),
      lineItems: result.lineItems.map(item => ({
        description: item.description,
        amount: item.amount,
        type: item.type
      })),
      subtotals: {
        lineItems: result.subtotals?.lineItems || 0,
        otherCharges: result.subtotals?.otherCharges || 0
      },
      summary: result.summary || 'Bill analysis completed'
    };

    console.log('Bill analysis completed successfully');
    return res.json(response);
  } catch (error) {
    console.error('Error analyzing bill:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to analyze bill' 
    });
  }
});

export default router;
