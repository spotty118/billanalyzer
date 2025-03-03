
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface Bill {
  id: number;
  account_number: string;
  billing_period: string;
  total_amount: number;
  created_at: string;
  analysis_data: any;
}

interface BillBreakdownChartProps {
  bills: Bill[];
}

// Helper function to extract and aggregate bill data
const extractBillBreakdown = (bills: Bill[]) => {
  // Default categories
  const categories = {
    "Plan Charges": 0,
    "Device Payments": 0, 
    "Services & Add-ons": 0,
    "Taxes & Fees": 0,
  };
  
  let validBills = 0;
  
  bills.forEach(bill => {
    if (!bill.analysis_data) return;
    
    validBills++;
    
    // Process phone line charges
    if (bill.analysis_data.phoneLines) {
      bill.analysis_data.phoneLines.forEach(line => {
        if (line.details) {
          // Plan costs
          if (line.details.planCost) {
            categories["Plan Charges"] += Number(line.details.planCost);
          }
          
          // Device payments
          if (line.details.devicePayment) {
            categories["Device Payments"] += Number(line.details.devicePayment);
          }
          
          // Protection services
          if (line.details.protection) {
            categories["Services & Add-ons"] += Number(line.details.protection);
          }
          
          // Line surcharges and taxes
          if (line.details.surcharges) {
            categories["Taxes & Fees"] += Number(line.details.surcharges);
          }
          
          if (line.details.taxes) {
            categories["Taxes & Fees"] += Number(line.details.taxes);
          }
        } else if (line.monthlyTotal) {
          // If we only have monthly total but no breakdown, 
          // estimate as plan charges
          categories["Plan Charges"] += Number(line.monthlyTotal) * 0.75;
          categories["Taxes & Fees"] += Number(line.monthlyTotal) * 0.25;
        }
      });
    }
    
    // Process account-wide charges
    if (bill.analysis_data.accountCharges) {
      if (bill.analysis_data.accountCharges.surcharges) {
        categories["Taxes & Fees"] += Number(bill.analysis_data.accountCharges.surcharges);
      }
      
      if (bill.analysis_data.accountCharges.taxes) {
        categories["Taxes & Fees"] += Number(bill.analysis_data.accountCharges.taxes);
      }
      
      if (bill.analysis_data.accountCharges.services) {
        categories["Services & Add-ons"] += Number(bill.analysis_data.accountCharges.services);
      }
    }
  });
  
  // If we have valid bills, average the values
  if (validBills > 0) {
    Object.keys(categories).forEach(key => {
      categories[key as keyof typeof categories] = 
        categories[key as keyof typeof categories] / validBills;
    });
  }
  
  // Convert to recharts format
  return Object.entries(categories).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function BillBreakdownChart({ bills }: BillBreakdownChartProps) {
  const data = extractBillBreakdown(bills);
  
  // Calculate total to show percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / total) * 100).toFixed(1);
      
      return (
        <Card className="bg-white p-2 border shadow-sm">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">${item.value.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{percentage}% of bill</p>
        </Card>
      );
    }
    return null;
  };
  
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
