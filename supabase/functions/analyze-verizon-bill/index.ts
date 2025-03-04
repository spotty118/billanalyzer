
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class VerizonBillParser {
  private text: string;
  private billData: any = {
    accountInfo: {},
    billSummary: {},
    lines: [],
    additionalFees: {},
    upcomingChanges: [],
    paymentOptions: []
  };

  constructor(text: string) {
    this.text = text;
  }

  parseAccountInfo() {
    const accountInfo: any = {};
    
    // Extract customer name
    const nameMatch = this.text.match(/([A-Z\s]+)\n[\d\s]+-[\d\s]+/);
    if (nameMatch) {
      accountInfo.customerName = nameMatch[1].trim();
    }
    
    // Extract account number
    const accountMatch = this.text.match(/Account(?:\s*#|\s*number|\s*:)?\s*(?::|-)?\s*(\d[\d-]{5,15})/i);
    if (accountMatch) {
      accountInfo.accountNumber = accountMatch[1];
    }
    
    // Extract bill date
    const billDateMatch = this.text.match(/Bill date\s+([A-Za-z]+\s+\d+,\s+\d{4})/i);
    if (billDateMatch) {
      accountInfo.billDate = billDateMatch[1];
    }
    
    // Extract billing period
    const billingPeriodMatch = this.text.match(/Billing period:?\s+([^$\n]+)/i);
    if (billingPeriodMatch) {
      accountInfo.billingPeriod = billingPeriodMatch[1].trim();
    }
    
    // Extract invoice number
    const invoiceMatch = this.text.match(/Invoice(?:\s*#|\s*:)?\s*(?::|-)?\s*(\d[\d-]{5,15})/i);
    if (invoiceMatch) {
      accountInfo.invoiceNumber = invoiceMatch[1];
    }
    
    // Extract due date
    const dueDateMatch = this.text.match(/Total due on\s+([A-Za-z]+\s+\d+)/i);
    if (dueDateMatch) {
      accountInfo.dueDate = dueDateMatch[1];
    }
    
    // Check if bill is overdue
    const overdueMatch = this.text.match(/Your bill is overdue/i);
    accountInfo.status = overdueMatch ? "Overdue" : "Current";
    
    this.billData.accountInfo = accountInfo;
    return accountInfo;
  }

  parseBillSummary() {
    const billSummary: any = {};
    
    // Extract total due
    const totalMatch = this.text.match(/Total\s+due\s+(?:on\s+[A-Za-z]+\s+\d+\s+)?\$\s*([\d,]+\.\d{2})/i);
    if (totalMatch) {
      billSummary.totalDue = parseFloat(totalMatch[1].replace(/,/g, ''));
    } else {
      // Alternative pattern
      const altTotalMatch = this.text.match(/(?:total|amount due|pay this amount):?\s*\$?([0-9,]+\.\d{2})/i);
      if (altTotalMatch) {
        billSummary.totalDue = parseFloat(altTotalMatch[1].replace(/,/g, ''));
      }
    }
    
    // Extract balance from last bill
    const balanceMatch = this.text.match(/Balance from last bill\s+\$\s*([\d,]+\.\d{2})/i);
    if (balanceMatch) {
      billSummary.previousBalance = parseFloat(balanceMatch[1].replace(/,/g, ''));
    }
    
    // Extract late fee if present
    const lateFeeMatch = this.text.match(/Late fee\s+\$\s*([\d,]+\.\d{2})/i);
    if (lateFeeMatch) {
      billSummary.lateFee = parseFloat(lateFeeMatch[1].replace(/,/g, ''));
    } else {
      billSummary.lateFee = 0.0;
    }
    
    // Extract this month's charges
    const chargesMatch = this.text.match(/This month['']s charges\s+\$\s*([\d,]+\.\d{2})/i);
    if (chargesMatch) {
      billSummary.currentCharges = parseFloat(chargesMatch[1].replace(/,/g, ''));
    }
    
    this.billData.billSummary = billSummary;
    return billSummary;
  }

  parseLines() {
    const lines: any[] = [];
    
    // Look for the bill summary by line section
    const billSummarySection = this.text.match(/Bill summary by line(.*?)(?:Account-wide charges & credits|$)/is);
    if (!billSummarySection) {
      console.log("Bill summary section not found");
      // Try alternate patterns for older bill formats
      this.parsePhoneNumbers(lines);
      return lines;
    }
    
    const billSummaryText = billSummarySection[1];
    
    // Pattern to match line items in the bill summary
    const linePattern = /([A-Za-z\s]+)\s+\$([\d,.]+)\n([A-Za-z0-9\s\(\)]+)\s\(([\d-]+)\)/g;
    
    let lineMatch;
    while ((lineMatch = linePattern.exec(billSummaryText)) !== null) {
      const owner = lineMatch[1].trim();
      const amount = parseFloat(lineMatch[2].replace(/,/g, ''));
      const device = lineMatch[3].trim();
      const phoneNumber = lineMatch[4].trim();
      
      // Skip account-wide charges
      if (owner.includes("Account-wide")) {
        continue;
      }
      
      const lineInfo: any = {
        owner,
        device,
        phoneNumber,
        totalAmount: amount,
        plan: {},
        devicePayment: {},
        services: []
      };
      
      // Try to find detailed information for this line
      const escapedDevice = device.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedPhoneNumber = phoneNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const lineSectionPattern = new RegExp(`${escapedDevice}\\s*\\n\\s*${escapedPhoneNumber}(.*?)(?:Plan\\s*\\nPlans are billed a month in advance|FOOTER|\\n\\n\\n|$)`, 'is');
      const lineSectionMatch = this.text.match(lineSectionPattern);
      
      if (lineSectionMatch) {
        const lineDetails = lineSectionMatch[1];
        
        // Extract plan information
        const planMatch = lineDetails.match(/Plan\s+\$\s*([\d,.]+)\n([A-Za-z0-9\s]+)\s+\$\s*([\d,.]+)/i);
        if (planMatch) {
          const planCost = parseFloat(planMatch[1].replace(/,/g, ''));
          const planName = planMatch[2].trim();
          const planBasePrice = parseFloat(planMatch[3].replace(/,/g, ''));
          
          lineInfo.plan = {
            name: planName,
            basePrice: planBasePrice,
            actualCost: planCost  // After discounts
          };
          
          // Look for discounts applied to the plan
          const discountMatch = lineDetails.match(/(\d+)% access discount -\$\s*([\d,.]+)/i);
          if (discountMatch) {
            lineInfo.plan.discount = {
              percentage: parseInt(discountMatch[1]),
              amount: parseFloat(discountMatch[2].replace(/,/g, ''))
            };
          }
        } else {
          // Simplified plan match for different formats
          const simplePlanMatch = lineDetails.match(/Plan\s+\$\s*([\d,.]+)/i);
          if (simplePlanMatch) {
            lineInfo.plan = {
              name: "Verizon Plan",
              actualCost: parseFloat(simplePlanMatch[1].replace(/,/g, ''))
            };
          }
        }
        
        // Extract device payment information
        const devicePaymentMatch = lineDetails.match(/Devices\s+\$\s*([\d,.]+)\n([A-Z0-9\s]+)\s+\$\s*([\d,.]+)\nPayment\s+(\d+)\s+of\s+(\d+)\s+\(\$\s*([\d,.]+)\s+remaining\)/i);
        
        if (devicePaymentMatch) {
          const paymentAmount = parseFloat(devicePaymentMatch[3].replace(/,/g, ''));
          const currentPayment = parseInt(devicePaymentMatch[4]);
          const totalPayments = parseInt(devicePaymentMatch[5]);
          const remainingBalance = parseFloat(devicePaymentMatch[6].replace(/,/g, ''));
          
          lineInfo.devicePayment = {
            amount: paymentAmount,
            currentPayment,
            totalPayments,
            remainingBalance
          };
          
          // Check for device promotional credits
          const promoMatch = lineDetails.match(/Device Promo[a-z\s]+-\$\s*([\d,.]+)/i);
          if (promoMatch) {
            lineInfo.devicePayment.promotionalCredit = parseFloat(promoMatch[1].replace(/,/g, ''));
          }
        } else {
          // Try alternate device payment pattern
          const altDeviceMatch = lineDetails.match(/Device Payment(.*?)\$\s*([\d,.]+)/is);
          if (altDeviceMatch) {
            lineInfo.devicePayment = {
              amount: parseFloat(altDeviceMatch[2].replace(/,/g, ''))
            };
          }
        }
        
        // Extract services and perks
        const servicesMatch = lineDetails.match(/Services & perks\s+\$\s*([\d,.]+)(.*?)(?:Surcharges|$)/is);
        if (servicesMatch) {
          const servicesAmount = parseFloat(servicesMatch[1].replace(/,/g, ''));
          const servicesDetails = servicesMatch[2];
          
          // Find individual services
          const servicePattern = /([A-Za-z0-9\s+]+)\s+\$\s*([\d,.]+)/g;
          let serviceMatch;
          
          while ((serviceMatch = servicePattern.exec(servicesDetails)) !== null) {
            const serviceName = serviceMatch[1].trim();
            const serviceCost = parseFloat(serviceMatch[2].replace(/,/g, ''));
            
            // Skip discounts which are typically negative
            if (!serviceName.toLowerCase().includes("discount")) {
              lineInfo.services.push({
                name: serviceName,
                cost: serviceCost
              });
            }
          }
        }
      }
      
      lines.push(lineInfo);
    }
    
    // If no lines found, try alternate pattern extraction
    if (lines.length === 0) {
      this.parsePhoneNumbers(lines);
    }
    
    this.billData.lines = lines;
    return lines;
  }

  // Alternative method to extract phone lines from bills with different formats
  parsePhoneNumbers(lines: any[]) {
    console.log("Using alternative phone number extraction");
    
    // Set of patterns for finding phone numbers in various contexts
    const phonePatterns = [
      /\b(\d{3})[-\s.]?(\d{3})[-\s.]?(\d{4})\b/g,
      /\((\d{3})\)\s*(\d{3})[-\s.]?(\d{4})/g,
      /([A-Za-z\s\d\-\.]+)\s*\((\d{3}[-\s]?\d{3}[-\s]?\d{4})\)\s*\$?([0-9\.]+)/g
    ];
    
    const allPhoneNumbers = new Set<string>();
    const phoneNumberContexts = new Map<string, string>();
    
    for (const pattern of phonePatterns) {
      let matches;
      while ((matches = pattern.exec(this.text)) !== null) {
        let phoneNumber = '';
        let context = matches[0];
        
        // Extract phone number based on which pattern matched
        if (context.includes('(') && context.includes(')')) {
          // Handle parentheses format
          const parenthesesMatch = context.match(/\((\d{3})\)[- ]?(\d{3})[- ]?(\d{4})/);
          if (parenthesesMatch) {
            phoneNumber = `${parenthesesMatch[1]}${parenthesesMatch[2]}${parenthesesMatch[3]}`;
          }
        } else if (matches[2] && matches[2].match(/\d{3}[-\s]?\d{3}[-\s]?\d{4}/)) {
          // Line item pattern match
          phoneNumber = matches[2].replace(/[^0-9]/g, '');
        } else if (matches[1] && matches[2] && matches[3]) {
          // Direct pattern match
          phoneNumber = `${matches[1]}${matches[2]}${matches[3]}`;
        }
        
        // Only add valid phone numbers
        if (phoneNumber && phoneNumber.length === 10) {
          allPhoneNumbers.add(phoneNumber);
          if (!phoneNumberContexts.has(phoneNumber) || context.length > phoneNumberContexts.get(phoneNumber)!.length) {
            phoneNumberContexts.set(phoneNumber, context);
          }
        }
      }
    }
    
    console.log(`Found ${allPhoneNumbers.size} phone numbers using alternative extraction`);
    
    // Extract additional details for each phone number
    for (const phoneNumber of allPhoneNumbers) {
      const phoneFormatted = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      const context = phoneNumberContexts.get(phoneNumber) || '';
      
      // Extract device name and owner
      let deviceName = "Unknown device";
      let ownerName = "";
      let monthlyTotal = 0;
      
      // Find device name
      const deviceMatches = [
        context.match(/Apple iPhone [\d\w\s]+/i),
        context.match(/Samsung Galaxy [\d\w\s]+/i),
        context.match(/Google Pixel [\d\w\s]+/i)
      ].filter(Boolean);
      
      if (deviceMatches.length > 0) {
        deviceName = deviceMatches[0]![0].trim();
      }
      
      // Find owner name
      const nameMatch = context.match(/^([A-Za-z\s]+?)\s+(?:Apple|Samsung|Google|iPhone|Galaxy|Pixel)/i);
      if (nameMatch) {
        ownerName = nameMatch[1].trim();
      }
      
      // Try to find monthly charges
      const chargeMatch = context.match(/\$(\d+\.\d{2})/);
      if (chargeMatch) {
        monthlyTotal = parseFloat(chargeMatch[1]);
      }
      
      // Extract plan info
      let planName = "Unknown plan";
      const planNameMatches = [
        this.text.match(new RegExp(`${phoneFormatted}[\\s\\S]*?Unlimited Plus`, 'i')),
        this.text.match(new RegExp(`${phoneFormatted}[\\s\\S]*?Unlimited Welcome`, 'i')),
        this.text.match(new RegExp(`${phoneFormatted}[\\s\\S]*?plan:\\s*([^\\n]+)`, 'i'))
      ].filter(Boolean);
      
      if (planNameMatches.length > 0) {
        if (planNameMatches[0]![0].includes("Unlimited Plus")) {
          planName = "Unlimited Plus";
        } else if (planNameMatches[0]![0].includes("Unlimited Welcome")) {
          planName = "Unlimited Welcome";
        } else if (planNameMatches[0]![1]) {
          planName = planNameMatches[0]![1].trim();
        }
      }
      
      lines.push({
        owner: ownerName,
        phoneNumber: phoneFormatted,
        device: deviceName,
        totalAmount: monthlyTotal,
        plan: { name: planName },
        devicePayment: {},
        services: []
      });
    }
    
    return lines;
  }

  parseAdditionalFees() {
    const fees: any = {};
    
    // Extract surcharges
    const surchargesMatch = this.text.match(/surcharges of \$\s*([\d,.]+)/i);
    if (surchargesMatch) {
      fees.surcharges = parseFloat(surchargesMatch[1].replace(/,/g, ''));
    }
    
    // Extract taxes and government fees
    const taxesMatch = this.text.match(/taxes and gov fees of \$\s*([\d,.]+)/i);
    if (taxesMatch) {
      fees.taxesAndGovtFees = parseFloat(taxesMatch[1].replace(/,/g, ''));
    }
    
    this.billData.additionalFees = fees;
    return fees;
  }

  parseUpcomingChanges() {
    const changes: string[] = [];
    
    // Look for sections that might contain upcoming changes
    const changeSections = [
      this.text.match(/Changes are coming to your plan\.(.*?)(?=Additional information|$)/is),
      this.text.match(/Important Information Regarding Your Customer Agreement(.*?)(?=Additional information continued|$)/is)
    ];
    
    for (const section of changeSections) {
      if (section) {
        // Clean up the text and add to changes
        const changeText = section[1].replace(/\s+/g, ' ').trim();
        if (changeText) {
          changes.push(changeText);
        }
      }
    }
    
    this.billData.upcomingChanges = changes;
    return changes;
  }

  parsePaymentOptions() {
    const paymentOptions: string[] = [];
    
    // Look for the "Ways to pay" section
    const paymentSection = this.text.match(/Ways to pay(.*?)Questions about your bill/is);
    if (paymentSection) {
      const paymentText = paymentSection[1];
      
      // Extract individual options
      const optionsPattern = /([A-Za-z\s]+)\n([^•]+?)(?=\n[A-Za-z\s]+\n|$)/g;
      let optionMatch;
      
      while ((optionMatch = optionsPattern.exec(paymentText)) !== null) {
        const method = optionMatch[1].trim();
        const description = optionMatch[2].replace(/\s+/g, ' ').trim();
        paymentOptions.push(`${method}: ${description}`);
      }
    }
    
    this.billData.paymentOptions = paymentOptions;
    return paymentOptions;
  }

  parseBill() {
    this.parseAccountInfo();
    this.parseBillSummary();
    this.parseLines();
    this.parseAdditionalFees();
    this.parseUpcomingChanges();
    this.parsePaymentOptions();
    
    return this.billData;
  }

  generateBillSummary() {
    const { accountInfo, billSummary, lines } = this.billData;
    
    // Calculate per-category totals
    let planTotal = 0;
    let deviceTotal = 0;
    let servicesTotal = 0;
    let feesTotal = 0;
    
    lines.forEach((line: any) => {
      if (line.plan && line.plan.actualCost) {
        planTotal += line.plan.actualCost;
      }
      
      if (line.devicePayment && line.devicePayment.amount) {
        deviceTotal += line.devicePayment.amount;
      }
      
      (line.services || []).forEach((service: any) => {
        servicesTotal += service.cost || 0;
      });
    });
    
    const additionalFees = this.billData.additionalFees;
    if (additionalFees) {
      feesTotal += (additionalFees.surcharges || 0) + (additionalFees.taxesAndGovtFees || 0);
    }
    
    return {
      accountNumber: accountInfo.accountNumber || "Unknown",
      totalAmount: billSummary.totalDue || 0,
      billingPeriod: accountInfo.billingPeriod || "Unknown",
      phoneLines: lines.map((line: any) => ({
        phoneNumber: line.phoneNumber,
        deviceName: line.device,
        ownerName: line.owner,
        planName: line.plan?.name || "Unknown plan",
        monthlyTotal: line.totalAmount || 0,
        details: {
          planCost: line.plan?.basePrice || line.plan?.actualCost || 0,
          planDiscount: line.plan?.discount?.amount || 0,
          devicePayment: line.devicePayment?.amount || 0,
          deviceCredit: line.devicePayment?.promotionalCredit || 0,
          protection: line.services?.find((s: any) => s.name.toLowerCase().includes("protect"))?.cost || 0,
          surcharges: 0, // Will be calculated proportionally
          taxes: 0 // Will be calculated proportionally
        }
      })),
      chargesByCategory: {
        plans: planTotal,
        devices: deviceTotal,
        services: servicesTotal,
        taxes: feesTotal
      },
      accountCharges: 0,
      billVersion: "JavaScript-Parser-v1.0"
    };
  }
}

async function analyzeVerizonBill(fileContent: string) {
  console.log("Analyzing Verizon bill with the comprehensive JavaScript parser...");
  
  // Create an instance of the parser and process the bill
  const parser = new VerizonBillParser(fileContent);
  const parsedData = parser.parseBill();
  
  // Generate a standardized summary compatible with existing UI
  const billSummary = parser.generateBillSummary();
  
  // Add additional information from parsing
  billSummary.upcomingChanges = parsedData.upcomingChanges;
  billSummary.paymentOptions = parsedData.paymentOptions;
  billSummary.accountInfo = parsedData.accountInfo;
  billSummary.rawBillSummary = parsedData.billSummary;
  
  console.log("Bill analysis completed successfully");
  return billSummary;
}

// Clean bill content by removing problematic sections
function cleanBillContent(fileContent: string): string {
  try {
    console.log("Cleaning bill content...");
    
    // Apply skip patterns from configuration
    let cleanedContent = fileContent;
    
    // 1. Remove all Talk Activity, Call Details, and Usage sections
    const sectionPatterns = [
      /\bTalk\s+Activity\b[\s\S]*?(?=(\r?\n\s*\r?\n|\r?\n\s*[A-Z][a-z]+|$))/gi,
      /\bCall\s+Details\b[\s\S]*?(?=(\r?\n\s*\r?\n|\r?\n\s*[A-Z][a-z]+|$))/gi,
      /\bCall\s+Log\b[\s\S]*?(?=(\r?\n\s*\r?\n|\r?\n\s*[A-Z][a-z]+|$))/gi,
      /\bUsage\s+Details\b[\s\S]*?(?=(\r?\n\s*\r?\n|\r?\n\s*[A-Z][a-z]+|$))/gi,
      /\bText\s+Activity\b[\s\S]*?(?=(\r?\n\s*\r?\n|\r?\n\s*[A-Z][a-z]+|$))/gi,
      /\bData\s+Usage\b[\s\S]*?(?=(\r?\n\s*\r?\n|\r?\n\s*[A-Z][a-z]+|$))/gi
    ];
    
    // Apply section removal
    for (const pattern of sectionPatterns) {
      try {
        cleanedContent = cleanedContent.replace(pattern, '');
      } catch (e) {
        console.error(`Error with pattern ${pattern}:`, e);
      }
    }
    
    // 2. Break up potential long number patterns that aren't real phone numbers
    const longNumberPattern = /\b\d{6,}\b/g;
    cleanedContent = cleanedContent.replace(longNumberPattern, '');
    
    console.log("Bill content cleaned successfully");
    return cleanedContent;
  } catch (error) {
    console.error("Error cleaning bill content:", error);
    // If there's an error, return the original content
    return fileContent;
  }
}

// Main server handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Extract API key from request in multiple formats
    const apiKey = req.headers.get('apikey') || 
                  req.headers.get('Authorization')?.replace('Bearer ', '') || 
                  '';
    
    console.log("Auth headers received:", {
      apikey: req.headers.get('apikey') ? 'Present' : 'Missing',
      authorization: req.headers.get('Authorization') ? 'Present' : 'Missing'
    });
    
    // Validate the API key exists
    if (!apiKey) {
      console.error("Missing authorization header - no apikey or Authorization header found");
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, 
          status: 401 
        }
      );
    }

    // Handle different content types
    const contentType = req.headers.get('content-type') || '';
    let fileContent = '';
    
    if (contentType.includes('multipart/form-data')) {
      // Process form data with file
      try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
          return new Response(
            JSON.stringify({ error: 'No valid file uploaded' }),
            { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        // Read the file content
        fileContent = await file.text();
        console.log("Received file with size:", fileContent.length);
        
      } catch (error) {
        console.error('Error processing form data:', error);
        return new Response(
          JSON.stringify({ error: `Error processing form data: ${error.message}` }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else if (contentType.includes('application/json')) {
      // Process JSON data (for testing or alternate input)
      try {
        const jsonData = await req.json();
        // Allow sample text to be passed for testing
        fileContent = jsonData.sampleText || jsonData.text || 'Sample Verizon bill content for testing';
        console.log('Using sample text for analysis:', fileContent.substring(0, 50) + '...');
      } catch (error) {
        console.error('Error processing JSON data:', error);
        return new Response(
          JSON.stringify({ error: `Error processing JSON data: ${error.message}` }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported content type' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Basic validation of file content
    if (!fileContent || fileContent.length < 10) {
      return new Response(
        JSON.stringify({ error: 'File content is too small or empty' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Clean the bill content before processing
    fileContent = cleanBillContent(fileContent);

    // Process the file content using our enhanced parser
    const analysisResult = await analyzeVerizonBill(fileContent);
    console.log("Analysis completed successfully");

    // Return the analysis result
    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: `Error processing request: ${error.message}` }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
