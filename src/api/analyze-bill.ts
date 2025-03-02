
import { server } from './server';
import { extractPdfText } from '../utils/pdf-parser';

// Real API endpoint for bill analysis
server.post('/api/analyze-bill', async (request: Request) => {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const billFile = formData.get('billFile') as File;
    
    if (!billFile) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract text based on file type
    let fileContent = '';
    
    if (billFile.type === 'application/pdf') {
      // Handle PDF files
      try {
        const buffer = await billFile.arrayBuffer();
        fileContent = await extractPdfText(buffer);
      } catch (pdfError) {
        console.error('Error extracting text from PDF:', pdfError);
        return new Response(JSON.stringify({ error: 'Failed to extract text from PDF' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // Handle text files or other formats
      fileContent = await billFile.text();
    }
    
    // Process the bill data
    const result = await processBillData(fileContent);
    
    return Response.json(result);
  } catch (error) {
    console.error('Error processing bill:', error);
    return new Response(JSON.stringify({ error: 'Error processing bill' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Process the bill data based on file content
async function processBillData(fileContent: string) {
  // Extract account information
  const accountNumber = extractAccountNumber(fileContent);
  const billingPeriod = extractBillingPeriod(fileContent);
  const totalAmount = extractTotalAmount(fileContent);
  
  // Extract all phone lines and their charges
  const phoneLines = extractPhoneLines(fileContent);
  
  // Categorize charges
  const chargesByCategory = categorizeCharges(fileContent);
  
  return {
    accountNumber,
    billingPeriod,
    totalAmount,
    phoneLines,
    chargesByCategory
  };
}

// Helper functions to extract information from bill text
function extractAccountNumber(text: string): string {
  const accountMatch = text.match(/Account:?\s*([A-Za-z0-9\-]+)/i);
  return accountMatch ? accountMatch[1] : 'Unknown';
}

function extractBillingPeriod(text: string): string {
  const periodMatch = text.match(/Billing Period:?\s*([A-Za-z0-9\s\-]+)/i);
  return periodMatch ? periodMatch[1].trim() : 'Unknown';
}

function extractTotalAmount(text: string): number {
  const amountMatch = text.match(/Total Amount Due\s*\$?([0-9,]+\.[0-9]{2})/i) || 
                      text.match(/Total due.*\$?([0-9,]+\.[0-9]{2})/i);
  
  if (amountMatch) {
    return parseFloat(amountMatch[1].replace(/,/g, ''));
  }
  return 0;
}

function extractPhoneLines(text: string): any[] {
  const lines = [];
  const lineMatches = text.matchAll(/([A-Za-z\s]+)\s*-\s*([^(]+)\s*\((\d{3}-\d{3}-\d{4})\).*?:\s*\$?([0-9.]+)/g);
  
  for (const match of lineMatches) {
    const [_, owner, device, phoneNumber, amountStr] = match;
    const amount = parseFloat(amountStr);
    
    if (!isNaN(amount)) {
      lines.push({
        phoneNumber: phoneNumber.trim(),
        deviceName: device.trim(),
        planName: extractPlanName(text, phoneNumber),
        monthlyTotal: amount,
        details: extractLineDetails(text, phoneNumber)
      });
    }
  }
  
  return lines;
}

function extractPlanName(text: string, phoneNumber: string): string {
  // Find the plan name in text near the phone number
  const planRegex = new RegExp(`${phoneNumber}[\\s\\S]*?Plan\\s+-\\s+([^-\\n]+)`, 'i');
  const planMatch = text.match(planRegex);
  return planMatch ? planMatch[1].trim() : 'Unlimited Plan';
}

function extractLineDetails(text: string, phoneNumber: string): any {
  // Extract detailed charges for a line
  const details = {
    planCost: 0,
    planDiscount: 0,
    devicePayment: 0,
    deviceCredit: 0,
    protection: 0,
    perks: 0,
    perksDiscount: 0,
    surcharges: 0,
    taxes: 0
  };
  
  // Extract the section for this phone number
  const phoneSection = extractSectionForPhone(text, phoneNumber);
  
  if (phoneSection) {
    // Extract plan cost
    const planMatch = phoneSection.match(/Plan\s+.*?:\s*\$?([0-9.]+)/i);
    if (planMatch) details.planCost = parseFloat(planMatch[1]);
    
    // Extract plan discount
    const discountMatch = phoneSection.match(/discount.*?:\s*-\$?([0-9.]+)/i);
    if (discountMatch) details.planDiscount = parseFloat(discountMatch[1]);
    
    // Extract device payment
    const deviceMatch = phoneSection.match(/Device.*?payment.*?:\s*\$?([0-9.]+)/i) || 
                        phoneSection.match(/Devices.*?([0-9.]+)/i);
    if (deviceMatch) details.devicePayment = parseFloat(deviceMatch[1]);
    
    // Extract device credit
    const creditMatch = phoneSection.match(/Device.*?credit.*?:\s*-\$?([0-9.]+)/i);
    if (creditMatch) details.deviceCredit = parseFloat(creditMatch[1]);
    
    // Extract protection
    const protectionMatch = phoneSection.match(/Protection.*?:\s*\$?([0-9.]+)/i);
    if (protectionMatch) details.protection = parseFloat(protectionMatch[1]);
    
    // Extract surcharges and taxes
    const surchargeMatches = phoneSection.matchAll(/Surcharges.*?:\s*\$?([0-9.]+)/gi);
    for (const match of surchargeMatches) {
      details.surcharges += parseFloat(match[1]);
    }
    
    const taxMatches = phoneSection.matchAll(/Tax.*?:\s*\$?([0-9.]+)/gi);
    for (const match of taxMatches) {
      details.taxes += parseFloat(match[1]);
    }
  }
  
  return details;
}

function extractSectionForPhone(text: string, phoneNumber: string): string {
  // Find the section of text related to a specific phone number
  const phoneRegex = new RegExp(`${phoneNumber}[\\s\\S]*?(?=(\\d{3}-\\d{3}-\\d{4}|Total:|$))`, 'i');
  const sectionMatch = text.match(phoneRegex);
  return sectionMatch ? sectionMatch[0] : '';
}

function categorizeCharges(text: string): any {
  // Categorize all charges
  return {
    plans: extractCategoryTotal(text, 'plan'),
    devices: extractCategoryTotal(text, 'device'),
    protection: extractCategoryTotal(text, 'protection'),
    surcharges: extractCategoryTotal(text, 'surcharge'),
    taxes: extractCategoryTotal(text, 'tax'),
    other: extractCategoryTotal(text, 'other')
  };
}

function extractCategoryTotal(text: string, category: string): number {
  let total = 0;
  
  // Different regex patterns based on category
  let pattern;
  switch(category) {
    case 'plan':
      pattern = /Plan\s+.*?:\s*\$?([0-9.]+)/gi;
      break;
    case 'device':
      pattern = /Device.*?:\s*\$?([0-9.]+)/gi;
      break;
    case 'protection':
      pattern = /Protection.*?:\s*\$?([0-9.]+)/gi;
      break;
    case 'surcharge':
      pattern = /Surcharge.*?:\s*\$?([0-9.]+)/gi;
      break;
    case 'tax':
      pattern = /Tax.*?:\s*\$?([0-9.]+)/gi;
      break;
    case 'other':
      // Catch-all for other charges
      pattern = /fee.*?:\s*\$?([0-9.]+)/gi;
      break;
  }
  
  const matches = text.matchAll(pattern);
  for (const match of matches) {
    total += parseFloat(match[1]);
  }
  
  return total;
}
