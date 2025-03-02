import { extractPdfText } from '../utils/pdf-parser';

// Type definitions
export interface BillLineDetails {
  planCost?: number;
  planDiscount?: number;
  devicePayment?: number;
  deviceCredit?: number;
  protection?: number;
  perks?: number;
  perksDiscount?: number;
  surcharges?: number;
  taxes?: number;
}

export interface PhoneLine {
  phoneNumber: string;
  deviceName: string;
  planName: string;
  monthlyTotal: number;
  details: BillLineDetails;
  charges?: any[];
}

export interface BillAnalysisResponse {
  accountNumber: string;
  totalAmount: number;
  billingPeriod: string;
  phoneLines: PhoneLine[];
  chargesByCategory: {
    plans: number;
    devices: number;
    protection: number;
    surcharges: number;
    taxes: number;
    other: number;
  };
}

// Main API endpoint for bill analysis
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const billFile = formData.get('billFile') as File;
    
    if (!billFile) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Process the file based on its type
    const fileType = billFile.type;
    const fileBuffer = await billFile.arrayBuffer();
    const analysisResult = await processBillData(fileBuffer, billFile.type);
    
    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing bill:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Process the uploaded bill file
async function processBillData(fileBuffer: ArrayBuffer, fileType: string): Promise<BillAnalysisResponse> {
  let billText: string;
  
  if (fileType === 'application/pdf') {
    // Extract text from PDF
    billText = await extractPdfText(fileBuffer);
  } else if (fileType === 'text/plain') {
    // Convert ArrayBuffer to string for text files
    const decoder = new TextDecoder('utf-8');
    billText = decoder.decode(fileBuffer);
  } else {
    throw new Error('Unsupported file format');
  }
  
  // Analyze the bill text and extract relevant information
  return analyzeBillText(billText);
}

// Analyze bill text to extract structured data
function analyzeBillText(billText: string): BillAnalysisResponse {
  try {
    // Initialize result structure
    const result: BillAnalysisResponse = {
      accountNumber: extractAccountNumber(billText),
      totalAmount: extractTotalAmount(billText),
      billingPeriod: extractBillingPeriod(billText),
      phoneLines: extractPhoneLines(billText),
      chargesByCategory: {
        plans: 0,
        devices: 0,
        protection: 0,
        surcharges: 0,
        taxes: 0,
        other: 0
      }
    };
    
    // Calculate charges by category based on the phone lines
    calculateChargesByCategory(result);
    
    return result;
  } catch (error) {
    console.error('Error in bill text analysis:', error);
    throw new Error('Failed to analyze bill text');
  }
}

// Extract account number from bill text
function extractAccountNumber(billText: string): string {
  const accountNumberRegex = /Account:?\s*([A-Za-z0-9\-]+)/i;
  const match = billText.match(accountNumberRegex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // Fallback in case the account number format is different
  return 'Unknown Account';
}

// Extract total amount from bill text
function extractTotalAmount(billText: string): number {
  const totalAmountRegex = /Total\s+Amount\s+Due\s*\$?([0-9,]+\.[0-9]{2})/i;
  const match = billText.match(totalAmountRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1].replace(',', ''));
  }
  
  // Secondary attempt with a different pattern
  const secondaryRegex = /Total\s+due.*?:?\s*\$?([0-9,]+\.[0-9]{2})/i;
  const secondaryMatch = billText.match(secondaryRegex);
  
  if (secondaryMatch && secondaryMatch[1]) {
    return parseFloat(secondaryMatch[1].replace(',', ''));
  }
  
  // Fallback value if no amount is found
  return 0;
}

// Extract billing period from bill text
function extractBillingPeriod(billText: string): string {
  const billingPeriodRegex = /Billing\s+Period:?\s*([A-Za-z0-9\s\-]+)/i;
  const match = billText.match(billingPeriodRegex);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Fallback in case the billing period format is different
  const dateRegex = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s*-\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i;
  const dateMatch = billText.match(dateRegex);
  
  if (dateMatch && dateMatch[0]) {
    return dateMatch[0];
  }
  
  // Default value if no billing period is found
  return 'Current Billing Period';
}

// Extract phone lines from bill text
function extractPhoneLines(billText: string): PhoneLine[] {
  const phoneLines: PhoneLine[] = [];
  
  // Look for line details sections
  const lineDetailsSections = extractLineSections(billText);
  
  if (lineDetailsSections.length === 0) {
    // Fallback to simpler pattern matching if structured sections aren't found
    return extractSimplePhoneLines(billText);
  }
  
  // Process each line detail section
  for (const section of lineDetailsSections) {
    const phoneNumber = extractPhoneNumber(section);
    const deviceName = extractDeviceName(section);
    
    if (phoneNumber) {
      const details: BillLineDetails = {
        planCost: extractPlanCost(section),
        planDiscount: extractPlanDiscount(section),
        devicePayment: extractDevicePayment(section),
        deviceCredit: extractDeviceCredit(section),
        protection: extractProtectionPlan(section),
        perks: extractPerks(section),
        perksDiscount: extractPerksDiscount(section),
        surcharges: extractSurcharges(section),
        taxes: extractTaxes(section)
      };
      
      // Calculate monthly total for this line
      const monthlyTotal = calculateMonthlyTotal(details);
      
      phoneLines.push({
        phoneNumber,
        deviceName: deviceName || `Device (${phoneNumber})`,
        planName: extractPlanName(section) || 'Verizon Plan',
        monthlyTotal,
        details
      });
    }
  }
  
  return phoneLines;
}

// Extract line sections from the bill text
function extractLineSections(billText: string): string[] {
  const sections: string[] = [];
  
  // Look for patterns that indicate the start of a line section
  const phoneNumberRegex = /(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4})/g;
  const phoneMatches = [...billText.matchAll(phoneNumberRegex)];
  
  if (phoneMatches.length === 0) {
    return sections;
  }
  
  // Extract sections around each phone number
  for (let i = 0; i < phoneMatches.length; i++) {
    const match = phoneMatches[i];
    if (!match.index) continue;
    
    const startIdx = match.index;
    const endIdx = i < phoneMatches.length - 1 && phoneMatches[i + 1].index 
      ? phoneMatches[i + 1].index 
      : billText.length;
    
    const section = billText.slice(startIdx, endIdx);
    if (section.length > 20) { // Ensure section is substantial
      sections.push(section);
    }
  }
  
  return sections;
}

// Fallback method to extract phone lines using simpler patterns
function extractSimplePhoneLines(billText: string): PhoneLine[] {
  const phoneLines: PhoneLine[] = [];
  const phoneNumberRegex = /(\d{3}-\d{3}-\d{4})/g;
  const phoneMatches = [...billText.matchAll(phoneNumberRegex)];
  
  for (const match of phoneMatches) {
    const phoneNumber = match[0];
    const surroundingText = extractSurroundingText(billText, match.index || 0, 200);
    
    // Extract device name from surrounding text
    const deviceName = extractDeviceNameFromSurrounding(surroundingText) || `Device (${phoneNumber})`;
    
    // Create estimated details based on surrounding text
    const details: BillLineDetails = {
      planCost: estimatePlanCost(surroundingText),
      devicePayment: estimateDevicePayment(surroundingText),
      protection: estimateProtectionCost(surroundingText),
      surcharges: estimateSurcharges(surroundingText),
      taxes: estimateTaxes(surroundingText)
    };
    
    // Calculate monthly total for this line
    const monthlyTotal = calculateMonthlyTotal(details);
    
    phoneLines.push({
      phoneNumber,
      deviceName,
      planName: extractPlanNameFromSurrounding(surroundingText) || 'Verizon Plan',
      monthlyTotal,
      details
    });
  }
  
  return phoneLines;
}

// Extract text surrounding a specific position
function extractSurroundingText(text: string, position: number, range: number): string {
  const start = Math.max(0, position - range / 2);
  const end = Math.min(text.length, position + range / 2);
  return text.slice(start, end);
}

// Extract phone number from a section
function extractPhoneNumber(section: string): string {
  const phoneNumberRegex = /(\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4})/;
  const match = section.match(phoneNumberRegex);
  return match ? match[1] : '';
}

// Extract device name from a section
function extractDeviceName(section: string): string {
  // Look for common device naming patterns
  const deviceNameRegex = /(Apple iPhone \d+|iPhone \d+|Samsung Galaxy S\d+|iPad|Apple Watch)/i;
  const match = section.match(deviceNameRegex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // Look for a pattern like "Device: Name"
  const deviceLabelRegex = /Device:?\s*([A-Za-z0-9\s]+)/i;
  const labelMatch = section.match(deviceLabelRegex);
  
  if (labelMatch && labelMatch[1]) {
    return labelMatch[1].trim();
  }
  
  return '';
}

// Extract device name from surrounding text
function extractDeviceNameFromSurrounding(text: string): string {
  const devicePatterns = [
    /Apple iPhone (\d+\s?(?:Pro|Plus|Max)?)/i,
    /iPhone (\d+\s?(?:Pro|Plus|Max)?)/i,
    /Samsung Galaxy S(\d+)/i,
    /iPad (?:Pro|Air|Mini)?/i,
    /Apple Watch/i
  ];
  
  for (const pattern of devicePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return '';
}

// Extract plan name from a section
function extractPlanName(section: string): string {
  const planNamePatterns = [
    /Plan - (.*?) -/i,
    /Plan: (.*?)(?:\n|$)/i,
    /(Unlimited Plus|Unlimited Welcome|Unlimited Ultimate)/i,
    /(Start Unlimited|Play More Unlimited|Do More Unlimited|Get More Unlimited)/i
  ];
  
  for (const pattern of planNamePatterns) {
    const match = section.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return '';
}

// Extract plan name from surrounding text
function extractPlanNameFromSurrounding(text: string): string {
  const planPatterns = [
    /(Unlimited Plus|Unlimited Welcome|Unlimited Ultimate)/i,
    /(Start Unlimited|Play More Unlimited|Do More Unlimited|Get More Unlimited)/i,
    /Plan: (.*?)(?:\n|$)/i
  ];
  
  for (const pattern of planPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return '';
}

// Extract plan cost from section
function extractPlanCost(section: string): number {
  const planCostRegex = /Plan.*?:?\s*\$?([0-9\.]+)/i;
  const match = section.match(planCostRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

// Extract plan discount from section
function extractPlanDiscount(section: string): number {
  const discountRegex = /(?:discount|access discount).*?-\$?([0-9\.]+)/i;
  const match = section.match(discountRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

// Extract device payment from section
function extractDevicePayment(section: string): number {
  const devicePaymentRegex = /(?:Device|Payment).*?\$?([0-9\.]+)/i;
  const match = section.match(devicePaymentRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

// Extract device credit from section
function extractDeviceCredit(section: string): number {
  const creditRegex = /(?:Device\sPromo|Credit).*?-\$?([0-9\.]+)/i;
  const match = section.match(creditRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

// Extract protection plan cost from section
function extractProtectionPlan(section: string): number {
  const protectionRegex = /(?:Protection|Insurance).*?\$?([0-9\.]+)/i;
  const match = section.match(protectionRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

// Extract perks costs from section
function extractPerks(section: string): number {
  const perksRegex = /(?:perks|premium|services).*?\$?([0-9\.]+)/i;
  const match = section.match(perksRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

// Extract perks discount from section
function extractPerksDiscount(section: string): number {
  const perksDiscountRegex = /(?:perks|premium|services).*?discount.*?-\$?([0-9\.]+)/i;
  const match = section.match(perksDiscountRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

// Extract surcharges from section
function extractSurcharges(section: string): number {
  const surchargesRegex = /(?:Surcharges|Recovery|Regulatory).*?\$?([0-9\.]+)/i;
  const matches = [...section.matchAll(new RegExp(surchargesRegex, 'gi'))];
  
  let total = 0;
  for (const match of matches) {
    if (match[1]) {
      total += parseFloat(match[1]);
    }
  }
  
  return total;
}

// Extract taxes from section
function extractTaxes(section: string): number {
  const taxesRegex = /(?:Taxes|Tax|Fee).*?\$?([0-9\.]+)/i;
  const matches = [...section.matchAll(new RegExp(taxesRegex, 'gi'))];
  
  let total = 0;
  for (const match of matches) {
    if (match[1]) {
      total += parseFloat(match[1]);
    }
  }
  
  return total;
}

// Estimate plan cost from text
function estimatePlanCost(text: string): number {
  const planCostRegex = /(?:plan|monthly|service).*?\$?(\d+\.\d{2}|\d+)/i;
  const match = text.match(planCostRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  // Fallback estimates based on common plan costs
  if (text.match(/unlimited/i)) {
    return 70; // Average unlimited plan cost
  }
  
  return 50; // Default plan cost estimate
}

// Estimate device payment from text
function estimateDevicePayment(text: string): number {
  const devicePaymentRegex = /(?:device|phone|equipment).*?payment.*?\$?(\d+\.\d{2}|\d+)/i;
  const match = text.match(devicePaymentRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

// Estimate protection cost from text
function estimateProtectionCost(text: string): number {
  const protectionRegex = /(?:protection|insurance|damage).*?\$?(\d+\.\d{2}|\d+)/i;
  const match = text.match(protectionRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  if (text.match(/protection|insurance|damage/i)) {
    return 15; // Average protection plan cost
  }
  
  return 0;
}

// Estimate surcharges from text
function estimateSurcharges(text: string): number {
  const surchargesRegex = /(?:surcharge|recovery|regulatory).*?\$?(\d+\.\d{2}|\d+)/i;
  const match = text.match(surchargesRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 3; // Default surcharges estimate
}

// Estimate taxes from text
function estimateTaxes(text: string): number {
  const taxesRegex = /(?:tax|fee).*?\$?(\d+\.\d{2}|\d+)/i;
  const match = text.match(taxesRegex);
  
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  
  return 5; // Default taxes estimate
}

// Calculate monthly total for a line based on details
function calculateMonthlyTotal(details: BillLineDetails): number {
  const planCost = (details.planCost || 0) - (details.planDiscount || 0);
  const deviceCost = (details.devicePayment || 0) - (details.deviceCredit || 0);
  const perksCost = (details.perks || 0) - (details.perksDiscount || 0);
  const feesAndTaxes = (details.surcharges || 0) + (details.taxes || 0);
  
  return planCost + deviceCost + (details.protection || 0) + perksCost + feesAndTaxes;
}

// Calculate charges by category based on phone lines
function calculateChargesByCategory(result: BillAnalysisResponse): void {
  let totalPlans = 0;
  let totalDevices = 0;
  let totalProtection = 0;
  let totalSurcharges = 0;
  let totalTaxes = 0;
  let totalOther = 0;
  
  for (const line of result.phoneLines) {
    totalPlans += (line.details.planCost || 0) - (line.details.planDiscount || 0);
    totalDevices += (line.details.devicePayment || 0) - (line.details.deviceCredit || 0);
    totalProtection += (line.details.protection || 0);
    totalSurcharges += (line.details.surcharges || 0);
    totalTaxes += (line.details.taxes || 0);
    
    // Other contains perks and any remaining amounts
    const perks = (line.details.perks || 0) - (line.details.perksDiscount || 0);
    const lineTotal = line.monthlyTotal;
    const accountedFor = (line.details.planCost || 0) - (line.details.planDiscount || 0) +
                          (line.details.devicePayment || 0) - (line.details.deviceCredit || 0) +
                          (line.details.protection || 0) + 
                          (line.details.surcharges || 0) + 
                          (line.details.taxes || 0) +
                          perks;
    
    totalOther += perks + Math.max(0, lineTotal - accountedFor);
  }
  
  result.chargesByCategory = {
    plans: parseFloat(totalPlans.toFixed(2)),
    devices: parseFloat(totalDevices.toFixed(2)),
    protection: parseFloat(totalProtection.toFixed(2)),
    surcharges: parseFloat(totalSurcharges.toFixed(2)),
    taxes: parseFloat(totalTaxes.toFixed(2)),
    other: parseFloat(totalOther.toFixed(2))
  };
}
