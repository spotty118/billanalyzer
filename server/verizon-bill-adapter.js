/**
 * Adapter module specifically for Verizon bill processing
 * This helps improve the line item extraction from Verizon bills
 */

// Known device pattern references to improve detection
const DEVICE_PATTERNS = [
  { pattern: /iphone 15 pro max/i, type: 'phone' },
  { pattern: /iphone 15 pro/i, type: 'phone' },
  { pattern: /iphone 15/i, type: 'phone' },
  { pattern: /iphone 14 plus/i, type: 'phone' },
  { pattern: /iphone 14/i, type: 'phone' },
  { pattern: /iphone 13/i, type: 'phone' },
  { pattern: /ipad.*generation/i, type: 'tablet' },
  { pattern: /watch ultra/i, type: 'watch' },
  { pattern: /arlo/i, type: 'camera' }
];

// Known plan pattern references
const PLAN_PATTERNS = [
  { pattern: /unlimited plus/i, type: 'plan' },
  { pattern: /unlimited welcome/i, type: 'plan' },
  { pattern: /more unlimited/i, type: 'plan' },
  { pattern: /number share/i, type: 'add-on' }
];

// Extract raw bill text directly from bill data
function extractRawText(billData) {
  if (typeof billData.markdown === 'string') {
    return billData.markdown;
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
 * Processes extracted bill data to improve Verizon-specific line item detection
 * @param {Object} billData - The bill data extracted by the standard parser
 * @returns {Object} - Enhanced bill data with better categorized line items 
 */
export function enhanceVerizonBillData(billData) {
  console.log("Starting Verizon bill enhancement...");
  
  const enhancedBillData = {
    ...billData,
    lineItems: [],
    charges: []
  };
  
  // Get the raw bill text for more aggressive extraction if needed
  const rawBillText = extractRawText(billData);
  
  // Collect all charges for reprocessing
  const allCharges = [...billData.lineItems, ...billData.charges];
  
  // First, look for device model and phone number patterns in the raw text
  const deviceEntries = [];
  const phoneNumberPattern = /\((\d{3})[-.]?(\d{3})[-.]?(\d{4})\)/g;
  let match;
  
  // Extract sections with both device type and phone number
  const sections = rawBillText.split(/\n\s*\n/); // Split by blank lines
  
  sections.forEach(section => {
    // Check if this section contains device information
    let deviceType = null;
    let phoneNumber = null;
    
    // Check for device patterns
    for (const device of DEVICE_PATTERNS) {
      if (device.pattern.test(section)) {
        deviceType = section.match(device.pattern)[0];
        break;
      }
    }
    
    // Check for phone number pattern
    const phoneMatch = section.match(phoneNumberPattern);
    if (phoneMatch) {
      phoneNumber = phoneMatch[0].replace(/[().-]/g, '');
    }
    
    // If we found both in the same section, record this device-phone pair
    if (deviceType && phoneNumber) {
      deviceEntries.push({
        device: deviceType,
        phone: phoneNumber,
        planName: null,
        charges: []
      });
      console.log(`Found device: ${deviceType} with phone: ${phoneNumber}`);
    }
  });
  
  // If direct detection failed, try more aggressive approach
  if (deviceEntries.length === 0) {
    console.log("No device entries found, using aggressive detection...");
    
    // Extract all device references
    const devices = [];
    for (const device of DEVICE_PATTERNS) {
      const pattern = new RegExp(device.pattern.source, 'gi'); // Global match
      let deviceMatch;
      while ((deviceMatch = pattern.exec(rawBillText)) !== null) {
        devices.push({
          device: deviceMatch[0],
          index: deviceMatch.index,
          type: device.type
        });
      }
    }
    
    // Extract all phone numbers
    const phones = [];
    while ((match = phoneNumberPattern.exec(rawBillText)) !== null) {
      phones.push({
        phone: match[0].replace(/[().-]/g, ''),
        index: match.index
      });
    }
    
    // Match devices with closest phone number by proximity in the text
    devices.forEach(device => {
      // Find closest phone number
      let closestPhone = null;
      let minDistance = Number.MAX_SAFE_INTEGER;
      
      phones.forEach(phone => {
        const distance = Math.abs(device.index - phone.index);
        if (distance < minDistance && distance < 200) { // Within 200 chars
          minDistance = distance;
          closestPhone = phone;
        }
      });
      
      if (closestPhone) {
        deviceEntries.push({
          device: device.device,
          phone: closestPhone.phone,
          planName: null,
          charges: []
        });
        console.log(`Matched device: ${device.device} with phone: ${closestPhone.phone}`);
      }
    });
  }
  
  // If we still don't have any device entries, create some from charges
  if (deviceEntries.length === 0 && allCharges.length > 0) {
    console.log("Creating device entries from charges...");
    
    // Get all charges that mention devices
    const deviceCharges = allCharges.filter(charge => 
      DEVICE_PATTERNS.some(device => device.pattern.test(charge.description))
    );
    
    deviceCharges.forEach(charge => {
      // Determine the device type
      let deviceType = null;
      for (const device of DEVICE_PATTERNS) {
        if (device.pattern.test(charge.description)) {
          deviceType = charge.description.match(device.pattern)[0];
          break;
        }
      }
      
      // Create a synthetic device entry
      deviceEntries.push({
        device: deviceType || charge.description,
        phone: null,  // Will try to match later
        planName: null,
        charges: []
      });
    });
  }
  
  // Force convert the raw charges into line items
  console.log(`Processing ${allCharges.length} charges into line items...`);
  
  // Create a map for easy lookup
  const deviceByPhone = new Map();
  deviceEntries.forEach(entry => {
    if (entry.phone) {
      deviceByPhone.set(entry.phone, entry);
    }
  });
  
  // Process the charges into line items and other charges
  const processedLineItems = [];
  const processedOtherCharges = [];
  
  allCharges.forEach(charge => {
    // Determine if this should be a line item
    let isLineItem = false;
    let associatedPhone = null;
    
    // Check if the charge is associated with a device
    const isDeviceCharge = DEVICE_PATTERNS.some(device => 
      device.pattern.test(charge.description)
    );
    
    // Check if the charge is associated with a plan
    const isPlanCharge = PLAN_PATTERNS.some(plan => 
      plan.pattern.test(charge.description)
    );
    
    // Check for phone number in the charge description
    const phoneMatch = charge.description.match(/\((\d{3})[-.]?(\d{3})[-.]?(\d{4})\)/);
    if (phoneMatch) {
      associatedPhone = phoneMatch[0].replace(/[().-]/g, '');
      isLineItem = true;
    }
    
    // Consider it a line item if:
    if (isDeviceCharge || // It mentions a device
        isPlanCharge ||   // It mentions a plan
        charge.type === 'devicePayment' || 
        charge.type === 'lineAccess' ||
        charge.type === 'plan' ||
        /line (?:access|charge)|access fee|(?:plan|feature) perk|payment \d+ of \d+/i.test(charge.description)) {
      isLineItem = true;
    }
    
    if (isLineItem) {
      // Create an enhanced line item charge
      processedLineItems.push({
        ...charge,
        isLineItem: true,
        phoneNumber: associatedPhone,
        isDeviceCharge: isDeviceCharge,
        isPlanCharge: isPlanCharge
      });
    } else {
      processedOtherCharges.push(charge);
    }
  });
  
  // Final fallback: if we still have no line items, force convert charges with certain keywords
  if (processedLineItems.length === 0 && processedOtherCharges.length > 0) {
    console.log("No line items detected, using keyword detection...");
    
    // Move charges with device, plan, or line keywords to line items
    const itemsToMove = [];
    processedOtherCharges.forEach((charge, index) => {
      if (/iphone|ipad|watch|device|plan|unlimited|line/i.test(charge.description)) {
        itemsToMove.push({
          charge: {
            ...charge,
            isLineItem: true,
            isManuallyClassified: true
          },
          index
        });
      }
    });
    
    // Remove these from other charges and add to line items
    itemsToMove.reverse().forEach(item => {
      processedOtherCharges.splice(item.index, 1);
      processedLineItems.push(item.charge);
    });
  }
  
  // Update the bill data
  enhancedBillData.lineItems = processedLineItems;
  enhancedBillData.charges = processedOtherCharges;
  
  console.log(`Enhanced Verizon bill data: Found ${enhancedBillData.lineItems.length} line items and ${enhancedBillData.charges.length} other charges`);
  return enhancedBillData;
}

/**
 * Extracts phone lines from a Verizon bill to create a structured view of the account
 * @param {Object} billData - The enhanced bill data
 * @returns {Array} - Array of phone line objects with associated devices and charges
 */
export function extractVerizonPhoneLines(billData) {
  console.log("Extracting phone lines from bill data...");
  
  const rawBillText = extractRawText(billData);
  
  // Directly extract device info from bill text
  const deviceInfo = extractDeviceInfo(rawBillText);
  console.log(`Extracted ${deviceInfo.length} devices directly from bill text`);
  
  // Map to hold phone lines with charges
  const phoneLines = new Map();
  
  // First, create phone lines for all directly extracted devices
  deviceInfo.forEach(device => {
    phoneLines.set(device.phoneNumber, {
      phoneNumber: device.phoneNumber,
      deviceName: device.device,
      planName: device.planType || null,
      monthlyTotal: 0,
      charges: []
    });
  });

  // Then process all line items to associate with phone lines
  billData.lineItems.forEach(item => {
    let phoneNumber = item.phoneNumber;
    
    // Try to extract phone from description if not available
    if (!phoneNumber) {
      const phoneMatch = item.description?.match(/\(?(\d{3})[-.]?(\d{3})[-.]?(\d{4})\)?/);
      if (phoneMatch) {
        phoneNumber = phoneMatch[0].replace(/[().-]/g, '');
      }
    }
    
    // If we found a phone number, associate the charge with it
    if (phoneNumber) {
      if (!phoneLines.has(phoneNumber)) {
        phoneLines.set(phoneNumber, {
          phoneNumber,
          deviceName: null,
          planName: null,
          monthlyTotal: 0,
          charges: []
        });
      }
      
      const phoneLine = phoneLines.get(phoneNumber);
      
      // Try to identify the device type
      if (!phoneLine.deviceName) {
        for (const device of DEVICE_PATTERNS) {
          if (item.description && device.pattern.test(item.description)) {
            phoneLine.deviceName = item.description;
            break;
          }
        }
      }
      
      // Try to identify the plan type
      if (!phoneLine.planName) {
        for (const plan of PLAN_PATTERNS) {
          if (item.description && plan.pattern.test(item.description)) {
            phoneLine.planName = item.description;
            break;
          }
        }
      }
      
      // Update monthly cost
      phoneLine.monthlyTotal += item.amount || 0;
      
      // Add charge to the phone line
      phoneLine.charges.push(item);
    }
  });
  
  // If we didn't find any phone lines but we know there are phone numbers in the bill,
  // use the device info we already extracted
  if (phoneLines.size === 0 && deviceInfo.length > 0) {
    console.log("No phone lines with charges found, using extracted device info...");
    
    // Create phone lines from device info
    deviceInfo.forEach(device => {
      phoneLines.set(device.phoneNumber, {
        phoneNumber: device.phoneNumber,
        deviceName: device.device || "Unknown device",
        planName: device.planType || "Unknown plan",
        monthlyTotal: 0,
        charges: []
      });
    });
  }
  
  // If we still don't have any phone lines but we have line items, create a single synthetic line
  if (phoneLines.size === 0 && billData.lineItems.length > 0) {
    console.log("Using line items to create fallback line...");

    // Create a fallback line using items
    const totalAmount = billData.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    phoneLines.set("unknown-line", {
      phoneNumber: "Unknown Line", 
      deviceName: billData.lineItems.find(item => /iphone|ipad|watch/i.test(item.description))?.description || "Unknown device",
      planName: billData.lineItems.find(item => /unlimited|plan/i.test(item.description))?.description || "Unknown plan",
      monthlyTotal: totalAmount,
      charges: billData.lineItems
    });
  }
  
  // Sort phone lines by total amount (descending)
  const sortedLines = Array.from(phoneLines.values())
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);
    
  console.log(`Extracted ${sortedLines.length} phone lines`);
  return sortedLines;
}

/**
 * Utility function to find text around a phone number in the bill text
 * @param {string} text - The bill text
 * @param {string} phoneNumber - The phone number to find
 * @param {number} context - Number of characters to include before and after
 * @returns {string} - The text surrounding the phone number
 */
function findTextAroundPhoneNumber(text, phoneNumber, context = 200) {
  // Format phone number for search with different patterns
  const patterns = [
    phoneNumber,
    phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'),
    phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  ];
  
  for (const pattern of patterns) {
    const index = text.indexOf(pattern);
    if (index !== -1) {
      const start = Math.max(0, index - context);
      const end = Math.min(text.length, index + pattern.length + context);
      return text.substring(start, end);
    }
  }
  
  return '';
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
    const planType = planMatches ? planMatches[0] : "Unknown plan";
    
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
        
        const planMatches = section.match(/(?:Unlimited|Share|Welcome|Plus|Plan)\s+(?:plan|welcome|plus)?/i);
        const planType = planMatches ? planMatches[0] : "Unknown plan";
        
        deviceInfo.push({
          device: deviceMatch[0],
          deviceType: device,
          phoneNumber,
          planType
        });
      }
    });
  }
  
  return deviceInfo;
}