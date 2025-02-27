/**
 * Improved Verizon Bill Analyzer
 * 
 * Enhanced version of the Verizon bill analyzer with better extraction capabilities
 * for account information, phone lines, and charges.
 */

/**
 * Helper method to extract raw text from the bill data
 * @param {Object} billData - The parsed bill data
 * @returns {string} - The raw text content of the bill
 */
export function extractRawText(billData) {
  if (billData.text) {
    return billData.text;
  }
  
  if (billData.pages && billData.pages.length > 0) {
    return billData.pages.map(page => page.text || '').join('\n');
  }
  
  if (billData.content && typeof billData.content === 'string') {
    return billData.content;
  }
  
  return '';
}

/**
 * Attempt to extract the account number and total from the bill text
 * @param {string} billText - Raw bill text content 
 * @returns {Object} - Account info object
 */
export function extractAccountInfo(billText) {
  // Extract account number
  const accountMatch = billText.match(/Account:\s*(\d+-\d+)/i);
  const accountNumber = accountMatch ? accountMatch[1] : 'Unknown';
  
  // Extract total amount
  // Try multiple patterns for total amount
  const totalMatch = billText.match(/Total Amount Due\s*\$?\s*(\d+\.\d+)/i) || 
                    billText.match(/Total due[^$]*\$\s*(\d+\.\d+)/i) ||
                    billText.match(/Your [^$]* bill is \$(\d+\.\d+)/i);
  const totalAmount = totalMatch ? parseFloat(totalMatch[1]) : 0;
  
  // Extract billing period
  const billingMatch = billText.match(/Billing period:\s*([A-Za-z]+\s*\d+\s*-\s*[A-Za-z]+\s*\d+,?\s*\d{4})/i);
  const billingPeriod = billingMatch ? billingMatch[1] : 'Unknown';
  
  return {
    accountNumber,
    totalAmount,
    billingPeriod
  };
}

/**
 * Parses a Verizon bill text to extract device-specific information more directly
 * @param {string} billText - The full bill text content
 * @returns {Array} - Array of device information objects
 */
export function extractDeviceInfo(billText) {  
  const deviceInfo = [];
  const processedPhones = new Set();
  
  // Line item patterns to recognize specific charges
  const planPattern = /(?:Unlimited Plus|Unlimited Welcome|More Unlimited|Number share)(?:\s+plan)?/gi;
  const devicePaymentPattern = /Payment \d+ of \d+ \(\$[\d\.,]+\s+remaining\)/gi;
  const discountPattern = /\d+% (?:access|feature) discount/gi;
  const creditPattern = /Credit \d+ of \d+ \(\-\$[\d\.,]+\s+remaining\)/gi;
  
  // Look for lines with specific device mentions and phone numbers  
  const phoneLinePattern = /(?:Apple|Samsung)?\s*(iPhone|iPad|Watch|Galaxy|Pixel|Arlo)(?:\s+\w+)*\s*\(\s*(\d{3})[.-]?(\d{3})[.-]?(\d{4})\s*\)/gi;
  let match;
  
  while ((match = phoneLinePattern.exec(billText)) !== null) {
    const device = match[1];
    const phoneNumber = match[2] + match[3] + match[4];
    
    // Skip if we've already processed this phone number
    if (processedPhones.has(phoneNumber)) {
      continue;
    }
    processedPhones.add(phoneNumber);
    
    // Look for the plan type in surrounding text
    const surroundingText = billText.substring(
      Math.max(0, match.index - 100),
      Math.min(billText.length, match.index + match[0].length + 200)
    );
    
    const planMatches = surroundingText.match(/(?:Unlimited|Share|Welcome|Plus|Plan)\s+(?:plan|welcome|plus)?/i);
    const planType = planMatches ? planMatches[0].trim() : "Unknown plan";
    
    // Add to device info
    deviceInfo.push({
      device: match[0].split('(')[0].trim(),
      deviceType: device,
      phoneNumber,
      planType
    });
  }
  
  // If we couldn't find any device info from the direct pattern,
  // try to use the bill section structure
  if (deviceInfo.length === 0) {
    const sections = billText.split(/(?:charges by line details|\n\s*\n)/);
    
    sections.forEach(section => {
      const deviceMatch = section.match(/(?:Apple|Samsung)?\s*(iPhone|iPad|Watch|Galaxy|Pixel|Arlo)(?:\s+\w+)*/i);
      const phoneMatch = section.match(/\(\s*(\d{3})[.-]?(\d{3})[.-]?(\d{4})\s*\)/);
      
      if (deviceMatch && phoneMatch) {
        const device = deviceMatch[1];
        const phoneNumber = phoneMatch[1] + phoneMatch[2] + phoneMatch[3];
        
        // Only add unique phone numbers
        if (!processedPhones.has(phoneNumber)) {
          processedPhones.add(phoneNumber);
          
          const planMatches = section.match(/(?:Unlimited|Share|Welcome|Plus|Plan)\s+(?:plan|welcome|plus)?/i);
          const planType = planMatches ? planMatches[0] : "Unknown plan";
          
          deviceInfo.push({
            device: deviceMatch[0],
            deviceType: device,
            phoneNumber,
            planType
          });
        }
      }
    });
  }
  
  return deviceInfo;
}

/**
 * Extract phone lines from the bill data
 * @param {Object} billData - The parsed bill data 
 * @returns {Map<string, Object>} - Map of phone lines keyed by phone number
 */
export function extractVerizonPhoneLines(billData) {
  console.log("Extracting phone lines from bill data...");
  
  // Map to track phone lines by number
  const phoneLines = new Map();
  const rawBillText = extractRawText(billData);
  
  // Directly extract device info from bill text
  const deviceInfo = extractDeviceInfo(rawBillText);
  console.log(`Extracted ${deviceInfo.length} devices directly from bill text`);
  
  // Create phone lines for all directly extracted devices
  deviceInfo.forEach(device => {
    phoneLines.set(device.phoneNumber, {
      phoneNumber: device.phoneNumber,
      deviceName: device.device,
      planName: device.planType || "Unknown plan",
      monthlyTotal: 0,
      charges: []
    });
  });
  
  // Process charges if available
  if (billData.lineItems && billData.lineItems.length > 0) {
    // Try to associate charges with phone lines
    billData.lineItems.forEach(item => {
      let matchedLine = null;
      
      // Check if the charge description contains a phone number
      if (item.description) {
        const phoneMatch = item.description.match(/\(?\d{3}[-.]?\d{3}[-.]?\d{4}\)?/);
        if (phoneMatch) {
          const phoneNumber = phoneMatch[0].replace(/[().-]/g, '');
          if (phoneLines.has(phoneNumber)) {
            matchedLine = phoneLines.get(phoneNumber);
          }
        }
      }
      
      // If we found a matching phone line, add the charge
      if (matchedLine) {
        matchedLine.charges.push(item);
        matchedLine.monthlyTotal += (item.amount || 0);
      }
    });
  }
  
  // Categorize and associate general charges with phone lines
  if (billData.charges && billData.charges.length > 0) {
    billData.charges.forEach(charge => {
      if (charge.description) {
        // Try to match charges to phone lines by number or device
        let matchedLine = null;
        
        // Look for phone numbers
        const phoneMatch = charge.description.match(/\(?\d{3}[-.]?\d{3}[-.]?\d{4}\)?/);
        if (phoneMatch) {
          const phoneNumber = phoneMatch[0].replace(/[().-]/g, '');
          if (phoneLines.has(phoneNumber)) {
            matchedLine = phoneLines.get(phoneNumber);
          }
        }
        
        // If no phone match, look for device names
        if (!matchedLine) {
          for (const [_, line] of phoneLines) {
            const deviceName = line.deviceName.toLowerCase();
            const chargeDesc = charge.description.toLowerCase();
            if (chargeDesc.includes(deviceName) || 
                (deviceName.includes('iphone') && chargeDesc.includes('iphone'))) {
              matchedLine = line;
              break;
            }
          }
        }
        
        // Add charge to the matched line or to a special "account charges" for tracking
        if (matchedLine) {
          matchedLine.charges.push(charge);
          matchedLine.monthlyTotal += (charge.amount || 0);
        }
      }
    });
  }
  
  console.log(`Extracted ${phoneLines.size} phone lines`);
  return phoneLines;
}

/**
 * Enhances the Verizon bill data by adding account information and
 * better organizing phone line details
 * @param {Object} billData - Raw bill data from parser
 * @returns {Object} - Enhanced bill data with account info and organized phone lines
 */
export function enhanceVerizonBillData(billData) {
  console.log("Starting Verizon bill enhancement with improved extraction...");
  
  // Get the raw bill text for analysis
  const rawBillText = extractRawText(billData);
  
  // Extract account information
  const accountInfo = extractAccountInfo(rawBillText);
  
  // Extract device and phone line information
  const deviceInfo = extractDeviceInfo(rawBillText);
  console.log(`Found ${deviceInfo.length} devices in bill text`);
  
  // Extract phone lines with charge association
  const phoneLines = extractVerizonPhoneLines(billData);
  
  // Start with a clean enhanced data object
  let enhancedBillData = {
    ...billData,
    accountNumber: accountInfo.accountNumber || billData.accountNumber,
    billingPeriod: accountInfo.billingPeriod || billData.billingPeriod,
    totalAmount: accountInfo.totalAmount || billData.totalAmount || 0,
    lineItems: [], // Charges specifically tied to a phone line
    charges: [],   // General account charges
    phoneLines: Array.from(phoneLines.values()),  // Structured phone line information
    lineDetails: [] // Detailed line breakdowns with all associated charges
  };
  
  // Extract detailed charges for each phone line
  enhancedBillData.lineDetails = enhancedBillData.phoneLines.map(line => {
    // Find section in bill text related to this phone
    const phoneRegex = new RegExp(`(?:${line.deviceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${line.phoneNumber.replace(/-/g, '[-]?')})(.{1,2000})(?=\\n\\n|\\n[A-Z][a-z]+ [A-Z][a-z]+\\n)`, 's');
    const sectionMatch = rawBillText.match(phoneRegex);
    let lineSection = sectionMatch ? sectionMatch[0] + sectionMatch[1] : '';
    
    // If we still can't find a section, try looking directly for the phone number pattern
    if (!lineSection || lineSection.length < 100) {
      // Format the phone as xxx-xxx-xxxx and xxx.xxx.xxxx to catch different formats
      const formattedPhone = `${line.phoneNumber.slice(0, 3)}[.-]?${line.phoneNumber.slice(3, 6)}[.-]?${line.phoneNumber.slice(6)}`;
      const altPhoneRegex = new RegExp(`(${formattedPhone})(.{1,2000})(?=\\n\\n|\\n[A-Z][a-z]+ [A-Z][a-z]+\\n)`, 's');
      const altSectionMatch = rawBillText.match(altPhoneRegex);
      if (altSectionMatch) {
        lineSection = altSectionMatch[0] + altSectionMatch[2];
      }
    }
    
    // Extract plan details
    // First try to match the PDF format with the Plan section header
    const planMatch = lineSection.match(/Plan\s*(?:\n\s*)?([\w\s]+)\s*\$?([\d\.]+)/);
    // Then try to find plan details in the section text
    const unlimitedMatch = lineSection.match(/(Unlimited\s+\w+)\s+(?:\n\s*)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec).+?\$([\d\.]+)/);
    
    // Extract plan discount
    const planDiscount = lineSection.match(/(?:50%|[0-9]+%) access discount.+?\$([\d\.]+)/);
    
    // Extract device payment
    const devicePaymentMatch = lineSection.match(/Payment \d+ of \d+ \(\$([\d\.,]+) remaining\)/);
    const devicePaymentAmountMatch = lineSection.match(/Payment \d+ of \d+.+?\s+\$([\d\.]+)/);
    
    // Extract protection plan
    const protectionMatch = lineSection.match(/Wireless Phone Protection.+?\$([\d\.]+)/);
    
    // Extract credits
    const creditMatch = lineSection.match(/Credit.+?\-\$([\d\.]+)/);
    
    // Extract surcharges
    const surchargesSection = lineSection.match(/Surcharges\s+\$(\d+\.\d+)/);
    let surcharges = 0;
    if (surchargesSection) {
      surcharges = parseFloat(surchargesSection[1]);
    } else {
      // Try an alternative pattern focusing on Fed Universal Service Charge, Regulatory Charge, etc.
      const fedUniversalMatch = lineSection.match(/Fed Universal Service Charge\s+\$(\d+\.\d+)/);
      const regulatoryMatch = lineSection.match(/Regulatory Charge\s+\$(\d+\.\d+)/);
      const adminMatch = lineSection.match(/(?:Admin|Telco) (?:&|Recovery) (?:Telco|Charge)\s+\$(\d+\.\d+)/);
      
      if (fedUniversalMatch) surcharges += parseFloat(fedUniversalMatch[1]);
      if (regulatoryMatch) surcharges += parseFloat(regulatoryMatch[1]);
      if (adminMatch) surcharges += parseFloat(adminMatch[1]);
    }
    
    // Extract taxes
    const taxesSection = lineSection.match(/Taxes\s+&\s+gov\s+fees\s+\$(\d+\.\d+)/);
    let taxes = 0;
    if (taxesSection) {
      taxes = parseFloat(taxesSection[1]);
    } else {
      // Try an alternative pattern looking for specific taxes
      const stateTaxMatch = lineSection.match(/AL State [\w\s]+Tax\s+\$(\d+\.\d+)/);
      const countyTaxMatch = lineSection.match(/[A-Za-z]+ Cnty (?:Sales )?Tax\s+\$(\d+\.\d+)/);
      const cityTaxMatch = lineSection.match(/[A-Za-z]+ (?:City|Beach) (?:Sales )?Tax\s+\$(\d+\.\d+)/);
      const e911Match = lineSection.match(/911 Fee\s+\$(\d+\.\d+)/);
      
      if (stateTaxMatch) taxes += parseFloat(stateTaxMatch[1]);
      if (countyTaxMatch) taxes += parseFloat(countyTaxMatch[1]);
      if (cityTaxMatch) taxes += parseFloat(cityTaxMatch[1]);
      if (e911Match) taxes += parseFloat(e911Match[1]);
    }
    
    // Extract perks like YouTube Premium
    const perksMatch = lineSection.match(/(?:Youtube Premium|Walmart\+ Membership)[\s\S]*?\$([\d\.]+)/);
    const perksDiscount = lineSection.match(/50% - feature discount[\s\S]*?\-\$([\d\.]+)/);
    
    // Calculate monthly cost based on extracted values
    let monthlyCost = 0;
    const finalPlanMatch = planMatch || unlimitedMatch;
    if (finalPlanMatch && finalPlanMatch[2]) monthlyCost += parseFloat(finalPlanMatch[2]);
    if (planDiscount && planDiscount[1]) monthlyCost -= parseFloat(planDiscount[1]);
    if (devicePaymentAmountMatch && devicePaymentAmountMatch[1]) monthlyCost += parseFloat(devicePaymentAmountMatch[1]);
    if (protectionMatch && protectionMatch[1]) monthlyCost += parseFloat(protectionMatch[1]);
    if (perksMatch && perksMatch[1]) monthlyCost += parseFloat(perksMatch[1]);
    if (perksDiscount && perksDiscount[1]) monthlyCost -= parseFloat(perksDiscount[1]);
    if (creditMatch && creditMatch[1]) monthlyCost -= parseFloat(creditMatch[1]);
    monthlyCost += surcharges;
    monthlyCost += taxes;
    
    return {
      phoneNumber: line.phoneNumber,
      deviceName: line.deviceName,
      planName: line.planName,
      monthlyTotal: monthlyCost > 0 ? monthlyCost : 0,
      details: {
        plan: finalPlanMatch ? finalPlanMatch[1].trim() : line.planName,
        planCost: finalPlanMatch && finalPlanMatch[2] ? parseFloat(finalPlanMatch[2]) : 0,
        planDiscount: planDiscount && planDiscount[1] ? parseFloat(planDiscount[1]) : 0,
        devicePayment: devicePaymentMatch && devicePaymentMatch[1] ? devicePaymentMatch[1] : '0',
        devicePaymentAmount: devicePaymentAmountMatch && devicePaymentAmountMatch[1] ? parseFloat(devicePaymentAmountMatch[1]) : 0,
        protection: protectionMatch && protectionMatch[1] ? parseFloat(protectionMatch[1]) : 0,
        perks: perksMatch && perksMatch[1] ? parseFloat(perksMatch[1]) : 0,
        perksDiscount: perksDiscount && perksDiscount[1] ? parseFloat(perksDiscount[1]) : 0,
        credits: creditMatch && creditMatch[1] ? parseFloat(creditMatch[1]) : 0,
        surcharges: surcharges,
        taxes: taxes
      }
    };
  });
  
  // Update the phone lines with the calculated monthly totals
  enhancedBillData.phoneLines.forEach((line, index) => {
    if (index < enhancedBillData.lineDetails.length) {
      line.monthlyTotal = enhancedBillData.lineDetails[index].monthlyTotal;
    }
  });
  
  // Store existing charges that couldn't be associated with phone lines
  const allCharges = [...billData.lineItems, ...billData.charges];
  const assignedChargeIds = new Set();
  
  // Mark charges that were assigned to phone lines
  enhancedBillData.phoneLines.forEach(line => {
    line.charges.forEach(charge => {
      if (charge.id) {
        assignedChargeIds.add(charge.id);
      }
    });
  });
  
  // Add unassigned charges to the general charges array
  allCharges.forEach(charge => {
    if (!charge.id || !assignedChargeIds.has(charge.id)) {
      enhancedBillData.charges.push(charge);
    }
  });
  
  console.log(`Enhanced Verizon bill data: ${enhancedBillData.phoneLines.length} phone lines, ${enhancedBillData.charges.length} general charges`);
  return enhancedBillData;
}

/**
 * Create a summary of the Verizon bill for easy viewing
 * @param {Object} enhancedBillData - Enhanced bill data from enhanceVerizonBillData
 * @returns {Object} - Summary of the bill
 */
export function createVerizonBillSummary(enhancedBillData) {
  const summary = {
    accountNumber: enhancedBillData.accountNumber,
    billingPeriod: enhancedBillData.billingPeriod,
    totalAmount: enhancedBillData.totalAmount,
    totalMonthlyLineCharges: 0,
    phoneLines: enhancedBillData.phoneLines.map(line => ({
      phoneNumber: line.phoneNumber,
      deviceName: line.deviceName,
      planName: line.planName,
      monthlyTotal: line.monthlyTotal,
      lineItems: enhancedBillData.lineDetails.find(detail => detail.phoneNumber === line.phoneNumber)?.details || {}
    })),
    generalCharges: enhancedBillData.charges.reduce((sum, charge) => sum + (charge.amount || 0), 0),
    deviceTypes: {}
  };
  
  // Calculate total monthly charges from all lines
  summary.totalMonthlyLineCharges = summary.phoneLines.reduce((total, line) => total + line.monthlyTotal, 0);
  
  // Count device types
  enhancedBillData.phoneLines.forEach(line => {
    const deviceType = line.deviceName.match(/(iPhone|iPad|Watch|Galaxy|Pixel|Arlo)/i);
    if (deviceType) {
      const type = deviceType[1].toLowerCase();
      summary.deviceTypes[type] = (summary.deviceTypes[type] || 0) + 1;
    }
  });
  
  return summary;
}