
import express from 'express';
import cors from 'cors';
import billAnalyzerRouter from './bill-analyzer-proxy.js';

const app = express();
const port = 3002;

const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Configure CORS
app.use(cors({
  origin: allowedOrigins
}));

// Parse JSON bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Use bill analyzer router
app.use(billAnalyzerRouter);

// Start server
app.listen(port, () => {
  console.log('Veriplan server running on port', port);
  console.log('Allowed origins:', allowedOrigins.join(' '));
});
