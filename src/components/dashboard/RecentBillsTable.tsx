
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/data/verizonPlans";

interface Bill {
  id: number;
  account_number: string;
  billing_period: string;
  total_amount: number;
  created_at: string;
  analysis_data: any;
}

interface RecentBillsTableProps {
  bills: Bill[];
}

export function RecentBillsTable({ bills }: RecentBillsTableProps) {
  // Function to count phone lines in the bill
  const countPhoneLines = (bill: Bill) => {
    if (bill.analysis_data && bill.analysis_data.phoneLines) {
      return bill.analysis_data.phoneLines.length;
    }
    return 'N/A';
  };
  
  // Function to format the date nicely
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  // Function to get the primary plan name from bill
  const getPrimaryPlan = (bill: Bill) => {
    if (!bill.analysis_data?.phoneLines?.length) return 'Unknown';
    
    // Get all plan names from the bill
    const planNames = bill.analysis_data.phoneLines
      .map((line: any) => line.planName || '')
      .filter(Boolean);
    
    if (!planNames.length) return 'Unknown';
    
    // Find the most common plan name
    const planCounts: Record<string, number> = {};
    let mostCommonPlan = '';
    let maxCount = 0;
    
    planNames.forEach((plan: string) => {
      planCounts[plan] = (planCounts[plan] || 0) + 1;
      if (planCounts[plan] > maxCount) {
        maxCount = planCounts[plan];
        mostCommonPlan = plan;
      }
    });
    
    return mostCommonPlan;
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>Billing Period</TableHead>
          <TableHead>Phone Lines</TableHead>
          <TableHead>Primary Plan</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Analyzed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <TableRow key={bill.id}>
            <TableCell className="font-medium">{bill.account_number}</TableCell>
            <TableCell>{bill.billing_period}</TableCell>
            <TableCell>{countPhoneLines(bill)}</TableCell>
            <TableCell>{getPrimaryPlan(bill)}</TableCell>
            <TableCell className="text-right">{formatCurrency(Number(bill.total_amount))}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDate(bill.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
