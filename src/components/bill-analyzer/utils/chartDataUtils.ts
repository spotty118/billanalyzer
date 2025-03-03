
// Prepare data for line items chart
export function prepareLineItemsData(phoneLines: any[] = []) {
  if (!phoneLines || !Array.isArray(phoneLines) || phoneLines.length === 0) {
    return [];
  }
  
  return phoneLines.map(line => {
    const details = line.details || {};
    const planCost = details.planCost || 0;
    const planDiscount = details.planDiscount || 0;
    const devicePayment = details.devicePayment || 0;
    const deviceCredit = details.deviceCredit || 0;
    const protection = details.protection || 0;
    const taxes = (details.surcharges || 0) + (details.taxes || 0);
    
    return {
      name: line.phoneNumber || 'Unknown',
      plan: planCost - planDiscount,
      device: devicePayment - deviceCredit,
      protection: protection,
      taxes: taxes
    };
  });
}

// Prepare data for category pie chart
export function prepareCategoryData(chargesByCategory: any = {}) {
  if (!chargesByCategory || typeof chargesByCategory !== 'object') {
    // Default categories if none are provided
    return [
      { name: 'Plan Charges', value: 65 },
      { name: 'Device Payments', value: 15 },
      { name: 'Services & Add-ons', value: 10 },
      { name: 'Taxes & Fees', value: 10 }
    ];
  }
  
  const result = [];
  
  for (const [key, value] of Object.entries(chargesByCategory)) {
    if (typeof value === 'number' && value > 0) {
      result.push({
        name: key,
        value: value
      });
    }
  }
  
  return result.length > 0 ? result : [
    { name: 'Plan Charges', value: 65 },
    { name: 'Device Payments', value: 15 },
    { name: 'Services & Add-ons', value: 10 },
    { name: 'Taxes & Fees', value: 10 }
  ];
}
