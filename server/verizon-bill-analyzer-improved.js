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
    phoneLines: Array.from(phoneLines.values())  // Structured phone line information
  };
  
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
    phoneLines: enhancedBillData.phoneLines.map(line => ({
      phoneNumber: line.phoneNumber,
      deviceName: line.deviceName,
      planName: line.planName,
      monthlyTotal: line.monthlyTotal
    })),
    generalCharges: enhancedBillData.charges.reduce((sum, charge) => sum + (charge.amount || 0), 0),
    deviceTypes: {}
  };
  
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