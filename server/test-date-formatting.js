
import { analyzeBill } from './verizon-bill-analyzer-improved.js';

/**
 * Test different billing period formats to ensure they're properly normalized
 */
const testBillingPeriodFormatting = () => {
  console.log('Testing billing period formatting...');
  
  const testCases = [
    {
      input: 'Dec 12 - Jan 11, 2025',
      expected: 'December 12, 2024 to January 11, 2025'
    },
    {
      input: 'November 12 - December 11, 2024',
      expected: 'November 12, 2024 to December 11, 2024'
    },
    {
      input: 'Jan 1 - Feb 1',
      expected: /January 1, \d{4} to February 1, \d{4}/
    },
    {
      input: 'Dec 31 - Jan 30',
      expected: /December 31, \d{4} to January 30, \d{4}/
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\nTest Case #${index + 1}: ${testCase.input}`);
    
    // Create minimal mock bill data with just the billing period
    const mockBill = {
      accountNumber: '123456789-00001',
      billingPeriod: testCase.input,
      totalAmount: 100
    };
    
    // Process with our analyzer
    const result = analyzeBill(mockBill);
    console.log(`  Result: ${result.billingPeriod}`);
    
    // Check if the result matches the expected output
    let passed = false;
    if (testCase.expected instanceof RegExp) {
      passed = testCase.expected.test(result.billingPeriod);
    } else {
      passed = result.billingPeriod === testCase.expected;
    }
    
    if (passed) {
      console.log('  ✅ PASSED');
    } else {
      console.log(`  ❌ FAILED - Expected: ${testCase.expected}`);
    }
  });
  
  // Test with missing billing period
  console.log('\nTest Case: Missing billing period');
  const mockBill = {
    accountNumber: '123456789-00001',
    billingPeriod: null,
    totalAmount: 100
  };
  
  const result = analyzeBill(mockBill);
  console.log(`  Result: ${result.billingPeriod}`);
  
  if (result.billingPeriod === 'Unknown') {
    console.log('  ✅ PASSED - Correctly handled missing billing period');
  } else {
    console.log('  ❌ FAILED - Should return "Unknown" for missing billing period');
  }
  
  console.log('\nBilling period formatting test completed');
};

// Run the test
testBillingPeriodFormatting();
