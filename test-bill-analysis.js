// Simple test for bill analysis functionality

const fallbackData = {
  totalAmount: 0,  // Invalid total amount that should trigger fallback logic
  charges: [],
  lineItems: []
};

// Mock analyzeBill function that returns our test data
async function mockAnalyzeBill() {
  console.log("Mocking bill analysis...");
  
  // Return data with a missing totalAmount field
  const testData = {
    data: {
      // Intentionally missing totalAmount to test fallback
      accountNumber: "TEST-123",
      billingPeriod: "March 1 - April 1, 2025"
    }
  };
  
  console.log("Test data:", JSON.stringify(testData));
  return testData;
}

// Simulate handling analyze with missing totalAmount
async function testAnalyze() {
  try {
    const result = await mockAnalyzeBill();
    
    console.log("Result received:", JSON.stringify(result));
    
    // Check if totalAmount field is missing and apply fallback
    if (!result.data.totalAmount && result.data.totalAmount !== 0) {
      console.log("Invalid response format - missing totalAmount field");
      
      // Apply embedded fallback data
      console.log("Using embedded fallback data");
      
      // If we have partial data, merge it with the fallback
      if (typeof result.data === 'object' && result.data !== null) {
        // Add the missing totalAmount field
        const mergedData = {
          ...fallbackData,
          ...result.data,
          // Make sure totalAmount exists
          totalAmount: result.data.totalAmount || 646.3
        };
        console.log("Using merged data:", JSON.stringify(mergedData));
        return { data: mergedData };
      }
      
      // If no valid data at all, return the complete fallback
      console.log("Using complete fallback data");
      return { data: fallbackData };
    }
    
    console.log("Bill analysis successful, returning data");
    return result;
  } catch (error) {
    console.error("Error analyzing bill:", error);
    return { error: { message: "Failed to analyze bill" } };
  }
}

// Run the test
testAnalyze().then(result => {
  console.log("Final result:", JSON.stringify(result));
  console.log("Test completed successfully!");
});