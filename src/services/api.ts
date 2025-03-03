/**
 * API service for Verizon Bill Analyzer
 */

// Define the valid trend types to match the component's expectations
type TrendType = 'stable' | 'increasing' | 'decreasing';


/**
 * Analyze a bill file and return structured data
 * @param file The bill file to analyze (PDF, CSV, or TXT)
 * @returns Promise resolving to the analysis result
 */
export async function analyzeBill(file: File) {
  try {
    // In a real implementation, this would call a backend API
    // For now, we'll just simulate a delay and return mock data
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Ensure trend is of the correct type
    const trend: TrendType = 'stable';

    // Simulate a successful response
    return {
      data: {
        accountNumber: 'VRZN-12345-678',
        billingPeriod: 'Feb 15 - Mar 14, 2025',
        totalAmount: 185.67,
        phoneLines: [
          {
            phoneNumber: '(555) 123-4567',
            deviceName: 'iPhone 15 Pro',
            planName: 'Unlimited Plus',
            monthlyTotal: 94.99,
            details: {
              planCost: 80.00,
              planDiscount: 10.00,
              devicePayment: 29.99,
              deviceCredit: 15.00,
              protection: 15.00,
              surcharges: 3.50,
              taxes: 6.50,
              perks: 0,
              perksDiscount: 0
            }
          },
          {
            phoneNumber: '(555) 987-6543',
            deviceName: 'Samsung Galaxy S23',
            planName: 'Unlimited Basic',
            monthlyTotal: 75.68,
            details: {
              planCost: 60.00,
              planDiscount: 0,
              devicePayment: 24.99,
              deviceCredit: 10.00,
              protection: 15.00,
              surcharges: 2.85,
              taxes: 7.84,
              perks: 0,
              perksDiscount: 0
            }
          }
        ],
        chargesByCategory: {
          plans: 130.00,
          devices: 29.98,
          protection: 30.00,
          surcharges: 6.35,
          taxes: 14.34,
          other: 0
        },
        usageAnalysis: {
          avg_data_usage_gb: 12.5,
          avg_talk_minutes: 220,
          avg_text_messages: 450,
          trend
        },
        costAnalysis: {
          averageMonthlyBill: 185.67,
          projectedNextBill: 181.95,
          potentialSavings: [
            {
              description: 'Optimize device protection plans',
              estimatedSaving: 15.00
            },
            {
              description: 'Switch to family plan',
              estimatedSaving: 25.00
            },
            {
              description: 'Enroll in autopay & paperless billing',
              estimatedSaving: 10.00
            }
          ]
        },
        planRecommendation: {
          recommendedPlan: '5G Play More Unlimited',
          estimatedMonthlySavings: 30.00,
          confidenceScore: 0.85,
          reasons: [
            'Better value for your typical usage of 12.5 GB per line',
            'Includes premium features like HD streaming and mobile hotspot',
            'Eligible for device upgrade promotions',
            'Simplified billing with no overage charges'
          ],
          alternativePlans: [
            {
              name: '5G Start Unlimited',
              monthlyCost: 140.00,
              pros: ['Lower monthly cost', 'Unlimited data with no overage charges', 'Includes 5G access'],
              cons: ['Slower speeds during network congestion', 'Limited mobile hotspot', 'SD streaming only']
            },
            {
              name: '5G Do More Unlimited',
              monthlyCost: 170.00,
              pros: ['600GB cloud storage', '50GB premium network access', 'Unlimited mobile hotspot (25GB at 5G speeds)'],
              cons: ['Higher monthly cost', 'May be more features than needed based on your usage']
            }
          ]
        }
      }
    };
  } catch (error) {
    console.error('Error analyzing bill:', error);
    return {
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    };
  }
}
