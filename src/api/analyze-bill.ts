
import { server } from './server';

// Real API endpoint for bill analysis
server.post('/api/analyze-bill', async (request: Request) => {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const billFile = formData.get('billFile') as File;
    
    if (!billFile) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the file content
    const fileContent = await billFile.text();
    
    // Process the bill data
    const result = await processBillData(fileContent);
    
    return Response.json(result);
  } catch (error) {
    console.error('Error processing bill:', error);
    return Response.json({ 
      error: 'Failed to analyze bill',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

// Process the bill data based on file content
async function processBillData(fileContent: string) {
  // Extract account information
  const accountNumber = extractAccountNumber(fileContent);
  const billingPeriod = extractBillingPeriod(fileContent);
  const totalAmount = extractTotalAmount(fileContent);
  
  // Extract line details
  const phoneLines = extractPhoneLines(fileContent);
  
  // Calculate charges by category
  const chargesByCategory = calculateChargesByCategory(phoneLines);
  
  return {
    accountNumber,
    billingPeriod,
    totalAmount,
    phoneLines,
    chargesByCategory
  };
}

// Helper functions to extract data from bill content
function extractAccountNumber(content: string): string {
  // Look for patterns like "Account #: 123456789-00001"
  const accountMatch = content.match(/Account\s*(?:#|number|no|num)\s*:?\s*([0-9-]+)/i);
  return accountMatch ? accountMatch[1] : "Unknown";
}

function extractBillingPeriod(content: string): string {
  // Look for billing period patterns
  const periodMatch = content.match(/(?:billing period|bill cycle|service period)(?::\s*|\s+)([A-Za-z]{3}\s+\d{1,2}\s+-\s+[A-Za-z]{3}\s+\d{1,2},?\s+\d{4})/i);
  
  if (periodMatch) {
    return periodMatch[1];
  }
  
  // If no specific format found, use current date as fallback
  const now = new Date();
  const month = now.toLocaleString('default', { month: 'short' });
  const nextMonth = new Date(now);
  nextMonth.setMonth(now.getMonth() + 1);
  const nextMonthName = nextMonth.toLocaleString('default', { month: 'short' });
  
  return `${month} ${now.getDate()} - ${nextMonthName} ${now.getDate()}, ${now.getFullYear()}`;
}

function extractTotalAmount(content: string): number {
  // Look for patterns like "Total: $123.45" or "Amount Due: $123.45"
  const amountMatch = content.match(/(?:total(?:\s+amount)?|amount\s+due)\s*:?\s*\$?\s*(\d+\.\d{2})/i);
  
  if (amountMatch) {
    return parseFloat(amountMatch[1]);
  }
  
  // Secondary pattern
  const altMatch = content.match(/\$\s*(\d+\.\d{2})(?:\s+(?:due|total))/i);
  return altMatch ? parseFloat(altMatch[1]) : 0;
}

function extractPhoneLines(content: string): any[] {
  const lines = [];
  const phoneNumberPattern = /(\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4})/g;
  const phoneMatches = content.matchAll(phoneNumberPattern);
  
  for (const match of phoneMatches) {
    const phoneNumber = match[0];
    // Find a section of content associated with this number
    const sectionStart = Math.max(0, content.indexOf(phoneNumber) - 200);
    const sectionEnd = Math.min(content.length, content.indexOf(phoneNumber) + 500);
    const section = content.substring(sectionStart, sectionEnd);
    
    // Extract device name
    const deviceMatch = section.match(/(?:device|model|phone):\s*([A-Za-z0-9\s]+(?:iPhone|Galaxy|Pixel|iPad|Watch|Pro|Plus|Max|mini|Ultra|SE)[A-Za-z0-9\s]*)/i);
    const deviceName = deviceMatch ? deviceMatch[1].trim() : "Unknown Device";
    
    // Extract plan name
    const planMatch = section.match(/(?:plan|service):\s*([A-Za-z0-9\s]+(?:Unlimited|Limited|Basic|Premium|Plus|Max|Family|Pro|Welcome)[A-Za-z0-9\s]*)/i);
    const planName = planMatch ? planMatch[1].trim() : "Unlimited Plus";
    
    // Try to extract charges
    const planCostMatch = section.match(/plan\s*(?:cost|charge):\s*\$?(\d+\.\d{2})/i);
    const devicePaymentMatch = section.match(/(?:device\s*payment|equipment\s*charge):\s*\$?(\d+\.\d{2})/i);
    const protectionMatch = section.match(/(?:protection|insurance)(?:\s*plan)?:\s*\$?(\d+\.\d{2})/i);
    const taxesMatch = section.match(/(?:taxes|fees)(?:\s*and\s*(?:taxes|fees))?:\s*\$?(\d+\.\d{2})/i);
    
    const details = {
      planCost: planCostMatch ? parseFloat(planCostMatch[1]) : 0,
      planDiscount: 0,
      devicePayment: devicePaymentMatch ? parseFloat(devicePaymentMatch[1]) : 0,
      deviceCredit: 0,
      protection: protectionMatch ? parseFloat(protectionMatch[1]) : 0,
      perks: 0,
      perksDiscount: 0,
      surcharges: 0,
      taxes: taxesMatch ? parseFloat(taxesMatch[1]) : 0
    };
    
    // Calculate total for this line
    const monthlyTotal = Object.values(details).reduce((sum, value) => sum + value, 0);
    
    lines.push({
      phoneNumber,
      deviceName,
      planName,
      monthlyTotal,
      details
    });
  }
  
  return lines;
}

function calculateChargesByCategory(phoneLines: any[]): any {
  return {
    plans: phoneLines.reduce((sum, line) => sum + (line.details.planCost || 0) - (line.details.planDiscount || 0), 0),
    devices: phoneLines.reduce((sum, line) => sum + (line.details.devicePayment || 0) - (line.details.deviceCredit || 0), 0),
    protection: phoneLines.reduce((sum, line) => sum + (line.details.protection || 0), 0),
    surcharges: phoneLines.reduce((sum, line) => sum + (line.details.surcharges || 0), 0),
    taxes: phoneLines.reduce((sum, line) => sum + (line.details.taxes || 0), 0),
    other: phoneLines.reduce((sum, line) => sum + (line.details.perks || 0) - (line.details.perksDiscount || 0), 0)
  };
}
