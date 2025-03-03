import { serve } from "./deps.ts";
import type {
  BillAnalysisResult,
  PhoneLine,
  PlanDetails
} from "./deps.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function declarations
function extractPhoneNumbers(fileContent: string): Set<string> {
  const processedPhoneNumbers = new Set<string>();

  // Define various phone number pattern formats
  const phonePatterns = [
    // Standard format (123-456-7890)
    /(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})/g,
    
    // Parentheses format ((123) 456-7890)
    /\((\d{3})\)\s*(\d{3})[-\s]?(\d{4})/g,
    
    // With keywords (phone: 123-456-7890)
    /(?:phone|cell|mobile|number)[:\s]+(?:\+?1\s*)?(\d{3})[-\s]?(\d{3})[-\s]?(\d{4})/gi,

    // Line item format (device name + number)
    /([A-Za-z\s\d.]+\((\d{3})[-\s]?(\d{3})[-\s]?(\d{4})\))/g
  ];

  interface Match {
    [key: number]: string;
    length: number;
  }

  // Extract all phone numbers using all patterns
  for (const pattern of phonePatterns) {
    const matches = Array.from(fileContent.matchAll(pattern)) as Match[];
    
    for (const match of matches) {
      let phoneNumber = '';
      
      if (match.length >= 4) {
        // Format with 3 capture groups (area code, prefix, line)
        phoneNumber = `${match[1]}${match[2]}${match[3]}`;
      } else if (match.length >= 2) {
        // Format with a single capture group
        phoneNumber = match[1].replace(/\D/g, '');
      }
      
      // Validate it's a proper 10-digit number and not a duplicate
      if (phoneNumber.length === 10 && !processedPhoneNumbers.has(phoneNumber)) {
        processedPhoneNumbers.add(phoneNumber);
        console.log(`Found phone number: ${phoneNumber}`);
      }
    }
  }

  return processedPhoneNumbers;
}

async function analyzeVerizonBill(fileContent: string): Promise<BillAnalysisResult> {
  console.log("Analyzing Verizon bill with improved phone number detection...");
  
  // Extract phone numbers using our enhanced extraction function
  const phoneNumbers = extractPhoneNumbers(fileContent);
  
  // Initialize phone lines array
  const phoneLines: PhoneLine[] = [];
  
  // Process each phone number
  for (const phoneNumber of phoneNumbers) {
    const formattedNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    
    // Look for associated details near this phone number
    const phoneContext = fileContent.split(formattedNumber)
      .map(section => section.slice(-500) + formattedNumber + section.slice(0, 500))
      .join('\n');
    
    // Extract details
    const deviceMatch = phoneContext.match(/(?:iPhone|Galaxy|iPad|Device)[\w\s]+/i);
    const ownerMatch = phoneContext.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:line|device|phone)/i);
    const planMatch = phoneContext.match(/(?:Unlimited\s+(?:Plus|Welcome|Start|Do|Play|Get|More)|5G\s+(?:Start|Do|Play|Get|More))/i);
    
    // Create phone line object
    phoneLines.push({
      phoneNumber: formattedNumber,
      deviceName: deviceMatch?.[0].trim() || "Unknown device",
      ownerName: ownerMatch?.[1]?.trim() || "",
      planName: planMatch?.[0].trim() || "Unknown plan",
      monthlyTotal: 40, // Default value
      details: {
        planCost: 40,
        planDiscount: 5,
        devicePayment: 0,
        deviceCredit: 0,
        protection: 0,
        surcharges: 3,
        taxes: 2
      }
    });
  }
  
  return {
    phoneLines,
    accountNumber: "Unknown",
    billingPeriod: "Current",
    totalAmount: phoneLines.reduce((sum, line) => sum + line.monthlyTotal, 0)
  };
}

// Add the request handler function
const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const apiKey = req.headers.get('apikey') || 
                   req.headers.get('Authorization')?.replace('Bearer ', '') || 
                   '';
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let fileContent = '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return new Response(
          JSON.stringify({ error: 'No valid file uploaded' }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      fileContent = await file.text();
      
    } else if (contentType.includes('application/json')) {
      const jsonData = await req.json();
      fileContent = jsonData.sampleText || jsonData.text || '';
      
      if (!fileContent) {
        return new Response(
          JSON.stringify({ error: 'No text content provided' }),
          { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported content type' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!fileContent || fileContent.length < 10) {
      return new Response(
        JSON.stringify({ error: 'File content is too small or empty' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const analysisResult = await analyzeVerizonBill(fileContent);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error processing request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: `Error processing request: ${errorMessage}` }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};

serve(handler);
