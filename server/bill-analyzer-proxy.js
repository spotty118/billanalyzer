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

/**
 * Enhanced bill analysis endpoint that accepts pre-parsed bill data
 * POST /api/analyze-bill/enhanced
 */
router.post('/analyze-bill/enhanced', async (req, res) => {
  try {
    const { billText } = req.body;
    if (!billText) {
      return res.status(400).json({ error: 'No bill data provided' });
    }

    const billData = JSON.parse(billText);

    // Analyze charges and line items
    const totalCharges = [...billData.charges, ...billData.lineItems];
    const monthlyCharges = totalCharges.filter(charge => 
      !charge.description.toLowerCase().includes('one-time') &&
      !charge.description.toLowerCase().includes('late fee')
    );

    // Calculate monthly trends
    const monthlyTotal = monthlyCharges.reduce((sum, charge) => sum + charge.amount, 0);
    const averagePerLine = monthlyTotal / billData.lineItems.length;

    // Build enhanced analysis response
    const response = {
      usageAnalysis: {
        trend: monthlyTotal > 600 ? "increasing" : "stable",
        percentageChange: ((monthlyTotal - billData.totalAmount) / billData.totalAmount) * 100
      },
      costAnalysis: {
        averageMonthlyBill: monthlyTotal,
        projectedNextBill: monthlyTotal + (averagePerLine * 0.02) // Project 2% increase
      },
      planRecommendation: {
        recommendedPlan: monthlyTotal > 600 ? "5G Get More" : "Current plan is optimal",
        reasons: [
          `Average cost per line: $${averagePerLine.toFixed(2)}`,
          monthlyTotal > 600 ? "High monthly charges suggest premium plan might offer better value" : 
                              "Current usage patterns align with plan features"
        ]
      }
    };

    return res.json(response);
  } catch (error) {
    console.error('Error in enhanced bill analysis:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to analyze bill' 
    });
  }
});

export default router;
