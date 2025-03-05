
interface LineItemsTabProps {
  billData: any;
  formatCurrency: (value: number) => string;
  carrierType?: string;
}

export function LineItemsTab({ 
  billData, 
  formatCurrency,
  carrierType = "verizon" 
}: LineItemsTabProps) {
  // Implementation to be added by another component
  return null;
}
