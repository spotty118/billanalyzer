
export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function prepareLineItemsData(phoneLines: any[] = []) {
  if (!phoneLines.length) return [];
  
  return phoneLines.map((line: any) => ({
    name: line.deviceName.split(' ').slice(0, 3).join(' '), // Shorten device name
    total: line.monthlyTotal,
    plan: line.details.planCost - (line.details.planDiscount || 0),
    device: (line.details.devicePayment || 0) - (line.details.deviceCredit || 0),
    protection: line.details.protection || 0,
    taxes: (line.details.surcharges || 0) + (line.details.taxes || 0)
  }));
}

export function prepareCategoryData(chargesByCategory: any) {
  if (!chargesByCategory) return [];
  
  return [
    { name: 'Plans', value: chargesByCategory.plans },
    { name: 'Devices', value: chargesByCategory.devices },
    { name: 'Protection', value: chargesByCategory.protection },
    { name: 'Surcharges', value: chargesByCategory.surcharges },
    { name: 'Taxes', value: chargesByCategory.taxes },
    { name: 'Other', value: chargesByCategory.other }
  ];
}

export function calculateCarrierSavings(carrierId: string, billData: any, getCarrierPlanPrice: Function, findBestCarrierMatch: Function, alternativeCarrierPlans: any[]) {
  if (!billData) return { monthlySavings: 0, annualSavings: 0, planName: '', price: 0 };
  
  const numberOfLines = billData.phoneLines.length;
  const mainVerizonPlan = billData.phoneLines[0]?.planName || 'Unlimited Plus';
  
  const matchedCarrierPlanId = findBestCarrierMatch(mainVerizonPlan, carrierId);
  const carrierPlan = alternativeCarrierPlans.find(p => p.id === matchedCarrierPlanId);
  
  if (!carrierPlan) return { monthlySavings: 0, annualSavings: 0, planName: '', price: 0 };
  
  const carrierPrice = getCarrierPlanPrice(carrierPlan, numberOfLines);
  const monthlySavings = billData.totalAmount - carrierPrice;
  
  return {
    monthlySavings,
    annualSavings: monthlySavings * 12,
    planName: carrierPlan.name,
    price: carrierPrice
  };
}
