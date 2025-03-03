import { enhancedAnalysis } from './enhanced-bill-analysis.js';

// Create a mock bill data object
const mockBillData = {
  account_info: {
    account_number: '123-456-7890',
    customer_name: 'Test Customer',
    billing_period_start: 'Jan 1, 2025',
    billing_period_end: 'Jan 31, 2025'
  },
  bill_summary: {
    previous_balance: 100.00,
    payments: -100.00,
    current_charges: 150.00,
    total_due: 150.00
  },
  plan_charges: [
    { description: 'Unlimited Plan', amount: 80.00 },
    { description: 'Line Access Fee', amount: 20.00 },
    { description: 'Premium Data Add-on', amount: 10.00 }
  ],
  equipment_charges: [
    { description: 'iPhone 15 Payment', amount: 30.00 }
  ],
  one_time_charges: [],
  taxes_and_fees: [
    { description: 'Federal Universal Service Fee', amount: 5.00 },
    { description: 'State Tax', amount: 5.00 }
  ],
  usage_details: {
    '123-456-7890': [
      {
        data_usage: '15 GB',
        talk_minutes: '120',
        text_count: '500'
      }
    ]
  }
};

// Test the enhanced analysis
const result = enhancedAnalysis(mockBillData);

console.log('\nEnhanced Analysis Results:');
console.log('\nUsage Analysis:', JSON.stringify(result.usageAnalysis, null, 2));
console.log('\nCost Analysis:', JSON.stringify(result.costAnalysis, null, 2));
console.log('\nPlan Recommendations:', JSON.stringify(result.planRecommendation, null, 2));

// Validate the results
const validationErrors = [];

// Check usage analysis
console.log('Debug usage analysis:', {
  trend: result.usageAnalysis?.trend,
  percentageChange: result.usageAnalysis?.percentageChange,
  avg_data_usage_gb: result.usageAnalysis?.avg_data_usage_gb,
  high_data_users: Array.isArray(result.usageAnalysis?.high_data_users)
});

if (result.usageAnalysis?.trend && 
    typeof result.usageAnalysis?.percentageChange === 'number' && 
    typeof result.usageAnalysis?.avg_data_usage_gb === 'number' && 
    Array.isArray(result.usageAnalysis?.high_data_users)) {
  console.log('✓ Usage analysis validation passed');
} else {
  validationErrors.push('Missing usage analysis data');
}

// Check cost analysis
if (!result.costAnalysis?.averageMonthlyBill || 
    !result.costAnalysis?.projectedNextBill || 
    !Array.isArray(result.costAnalysis?.unusualCharges)) {
  validationErrors.push('Missing cost analysis data');
} else {
  console.log('✓ Cost analysis validation passed');
}

// Check plan recommendations
if (!result.planRecommendation?.recommendedPlan || 
    !Array.isArray(result.planRecommendation?.reasons) || 
    !result.planRecommendation?.confidenceScore) {
  validationErrors.push('Missing plan recommendations');
} else {
  console.log('✓ Plan recommendations validation passed');
}

if (validationErrors.length > 0) {
  console.error('\nValidation Errors:', validationErrors);
  process.exit(1);
}

console.log('\nTest completed successfully!');
