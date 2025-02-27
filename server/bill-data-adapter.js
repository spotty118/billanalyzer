/**
 * This adapter converts the bill data structure from bill-parser.js
 * to the format expected by enhanced-bill-analysis.js
 */

export const adaptBillDataForEnhancedAnalysis = (billData) => {
  // Initialize adapted data structure
  const adaptedData = {
    bill_summary: {
      total_due: billData.totalAmount || 0,
      account_number: billData.accountNumber || '',
      billing_period: billData.billingPeriod || '',
    },
    plan_charges: [],
    equipment_charges: [],
    taxes_and_fees: [],
    usage_details: {}
  };

  // Convert line items and charges to the expected format
  if (billData.lineItems && billData.lineItems.length > 0) {
    // Process line items - extract phone numbers and associated charges
    billData.lineItems.forEach(item => {
      // Try to extract phone number from description or look for line number pattern
      const phoneMatch = item.description?.match(/\((\d{3}[-.]?\d{3}[-.]?\d{4})\)/) || 
                         item.description?.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
      const phoneNumber = phoneMatch ? phoneMatch[1] : null;
      
      if (phoneNumber) {
        // Initialize phone entry if it doesn't exist
        if (!adaptedData.usage_details[phoneNumber]) {
          adaptedData.usage_details[phoneNumber] = [{
            data_usage: '0 GB',  // Default values since we don't have this data
            talk_minutes: '0',
            text_count: '0'
          }];
        }
        
        // Categorize the charge
        if (item.type === 'devicePayment' || item.isDeviceCharge) {
          adaptedData.equipment_charges.push({
            description: item.description,
            amount: item.amount,
            phoneNumber
          });
        } else if (item.type === 'lineAccess' || item.type === 'plan') {
          adaptedData.plan_charges.push({
            description: item.description,
            amount: item.amount,
            phoneNumber
          });
        } else {
          adaptedData.plan_charges.push({
            description: item.description,
            amount: item.amount,
            phoneNumber
          });
        }
      }
    });
  }

  // Process general charges
  if (billData.charges && billData.charges.length > 0) {
    billData.charges.forEach(charge => {
      if (charge.type === 'surcharge' || 
          charge.description.toLowerCase().includes('tax') ||
          charge.description.toLowerCase().includes('fee')) {
        adaptedData.taxes_and_fees.push({
          description: charge.description,
          amount: charge.amount
        });
      } else if (charge.type === 'devicePayment' || charge.isDeviceCharge) {
        adaptedData.equipment_charges.push({
          description: charge.description,
          amount: charge.amount
        });
      } else {
        adaptedData.plan_charges.push({
          description: charge.description,
          amount: charge.amount
        });
      }
    });
  }

  // If we have no usage details yet, create at least one default phone entry
  if (Object.keys(adaptedData.usage_details).length === 0) {
    // Use the first phone number we can find in any line item
    const anyPhone = billData.lineItems.find(item => {
      const phoneMatch = item.description?.match(/\((\d{3}[-.]?\d{3}[-.]?\d{4})\)/) || 
                        item.description?.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
      return phoneMatch !== null;
    });
    
    let phoneNumber = '000-000-0000'; // Default
    if (anyPhone) {
      const phoneMatch = anyPhone.description.match(/\((\d{3}[-.]?\d{3}[-.]?\d{4})\)/) || 
                        anyPhone.description.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
      if (phoneMatch) {
        phoneNumber = phoneMatch[1];
      }
    }
    
    adaptedData.usage_details[phoneNumber] = [{
      data_usage: '0 GB',
      talk_minutes: '0',
      text_count: '0'
    }];
  }

  return adaptedData;
};