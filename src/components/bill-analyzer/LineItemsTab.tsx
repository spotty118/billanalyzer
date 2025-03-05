
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Smartphone, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const renderPhoneDetails = () => {
    if (!billData?.phoneLines || billData.phoneLines.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-6">
            No line items found in your bill data
          </TableCell>
        </TableRow>
      );
    }

    return billData.phoneLines.map((line: any, index: number) => (
      <TableRow key={index}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            {line.phoneNumber || `Line ${index + 1}`}
          </div>
        </TableCell>
        <TableCell>{line.ownerName || 'Unknown'}</TableCell>
        <TableCell>{line.planName || 'Unknown Plan'}</TableCell>
        <TableCell className="text-right">
          {line.details?.planCost ? formatCurrency(line.details.planCost) : '$0.00'}
          {line.details?.planDiscount ? (
            <span className="text-green-500 block text-xs">
              - {formatCurrency(line.details.planDiscount)}
            </span>
          ) : null}
        </TableCell>
        <TableCell className="text-right">
          {line.details?.devicePayment ? formatCurrency(line.details.devicePayment) : '$0.00'}
          {line.details?.deviceCredit ? (
            <span className="text-green-500 block text-xs">
              - {formatCurrency(line.details.deviceCredit)}
            </span>
          ) : null}
        </TableCell>
        <TableCell className="text-right font-semibold">
          {line.monthlyTotal ? formatCurrency(line.monthlyTotal) : formatCurrency(0)}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Line Item Details - {carrierType.charAt(0).toUpperCase() + carrierType.slice(1)}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-5 w-5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-sm">Breakdown of charges for each line on your account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phone Number</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Plan Cost</TableHead>
                <TableHead className="text-right">Device Payment</TableHead>
                <TableHead className="text-right">Monthly Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderPhoneDetails()}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
