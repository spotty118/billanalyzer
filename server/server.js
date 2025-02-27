
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Set up CORS
app.use(cors());

// Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up file storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Bill analysis endpoint
app.post('/api/analyze-bill', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Here you'd normally process the PDF file and extract data
    // For now, we'll return mock data
    const mockAnalysis = {
      totalAmount: 157.92,
      accountNumber: "123456789-00001",
      billingPeriod: "Jan 05, 2025 to Feb 04, 2025",
      charges: [
        { description: "Service charge", amount: 25.00, type: "service" },
        { description: "Equipment fee", amount: 10.00, type: "equipment" },
        { description: "Federal taxes", amount: 5.92, type: "tax" }
      ],
      lineItems: [
        { description: "Smartphone line 1", amount: 55.00, type: "plan" },
        { description: "Smartphone line 2", amount: 45.00, type: "plan" },
        { description: "Device payment - iPhone 15", amount: 17.00, type: "device" }
      ],
      subtotals: {
        lineItems: 117.00,
        otherCharges: 40.92
      },
      summary: "Bill analysis completed"
    };

    res.json(mockAnalysis);
  } catch (error) {
    console.error('Error analyzing bill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced bill analysis endpoint
app.post('/api/analyze-bill/enhanced', express.json(), async (req, res) => {
  try {
    if (!req.body.billText) {
      return res.status(400).json({ error: 'No bill text provided' });
    }

    // Here you'd normally process the bill text and extract enhanced data
    // For now, we'll return mock data
    const mockEnhancedAnalysis = {
      usageAnalysis: {
        trend: "increasing",
        percentageChange: 15,
        seasonalFactors: {
          highUsageMonths: ["December", "January"],
          lowUsageMonths: ["June", "July"]
        }
      },
      costAnalysis: {
        averageMonthlyBill: 150.00,
        projectedNextBill: 165.00,
        unusualCharges: [
          {
            description: "One-time activation fee",
            amount: 35.00,
            reason: "New line activation"
          }
        ],
        potentialSavings: [
          {
            description: "Switch to autopay",
            estimatedSaving: 10.00,
            confidence: 0.9
          },
          {
            description: "Bundle with home internet",
            estimatedSaving: 25.00,
            confidence: 0.8
          }
        ]
      },
      planRecommendation: {
        recommendedPlan: "Unlimited Ultimate",
        reasons: [
          "Higher data usage than current plan",
          "Includes premium entertainment perks"
        ],
        estimatedMonthlySavings: 15.00,
        confidenceScore: 0.85,
        alternativePlans: [
          {
            planName: "Unlimited Plus",
            pros: ["Lower monthly cost", "Sufficient data for most needs"],
            cons: ["Fewer entertainment perks", "Lower mobile hotspot allowance"],
            estimatedSavings: 25.00
          }
        ]
      }
    };

    res.json(mockEnhancedAnalysis);
  } catch (error) {
    console.error('Error generating enhanced analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

// MCP server proxy endpoint
app.post('/api/mcp', express.json(), async (req, res) => {
  try {
    const { actorId, input } = req.body;
    
    if (!actorId) {
      return res.status(400).json({ error: 'actorId is required' });
    }
    
    // Here you would typically make a call to the actual MCP service
    // For now, return a mock response
    const mockResponse = {
      runId: "mock-run-" + Date.now(),
      status: "SUCCEEDED",
      data: {
        result: `Processed actor ${actorId} with input parameters`,
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(mockResponse);
  } catch (error) {
    console.error('Error processing MCP request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
