
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash, Save, Percent, DollarSign } from 'lucide-react';

interface LineCharge {
  phoneNumber: string;
  deviceName: string;
  planName: string;
  planCost: number;
  planDiscount: number;
  planDiscountType: 'fixed' | 'percentage';
  devicePayment: number;
  deviceCredit: number;
  protection: number;
  surcharges: number;
  taxes: number;
}

interface ManualEntryFormProps {
  onSubmit: (data: {
    accountNumber: string;
    billingPeriod: string;
    totalAmount: number;
    phoneLines: Array<{
      phoneNumber: string;
      deviceName: string;
      planName: string;
      monthlyTotal: number;
      details: {
        planCost: number;
        planDiscount: number;
        planDiscountType?: 'fixed' | 'percentage';
        devicePayment: number;
        deviceCredit: number;
        protection: number;
        surcharges: number;
        taxes: number;
      }
    }>
  }) => void;
}

export function ManualEntryForm({ onSubmit }: ManualEntryFormProps) {
  const [accountNumber, setAccountNumber] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('');
  const [includeAccountFees, setIncludeAccountFees] = useState(true);
  const [accountFees, setAccountFees] = useState(0);
  const [lines, setLines] = useState<LineCharge[]>([
    {
      phoneNumber: '',
      deviceName: '',
      planName: 'Unlimited Plus',
      planCost: 80,
      planDiscount: 0,
      planDiscountType: 'fixed',
      devicePayment: 0,
      deviceCredit: 0,
      protection: 0,
      surcharges: 0,
      taxes: 0
    }
  ]);

  const planOptions = [
    'Unlimited Welcome',
    'Unlimited Plus',
    'Unlimited Ultimate',
    'One Unlimited',
    'More Unlimited',
    '5G Start'
  ];

  const addLine = () => {
    setLines([...lines, {
      phoneNumber: '',
      deviceName: '',
      planName: 'Unlimited Plus',
      planCost: 80,
      planDiscount: 0,
      planDiscountType: 'fixed',
      devicePayment: 0,
      deviceCredit: 0,
      protection: 0,
      surcharges: 0,
      taxes: 0
    }]);
  };

  const removeLine = (index: number) => {
    const updatedLines = [...lines];
    updatedLines.splice(index, 1);
    setLines(updatedLines);
  };

  const updateLine = (index: number, field: keyof LineCharge, value: string | number | 'fixed' | 'percentage') => {
    const updatedLines = [...lines];
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: typeof value === 'string' && 
               field !== 'phoneNumber' && 
               field !== 'deviceName' && 
               field !== 'planName' &&
               field !== 'planDiscountType'
        ? parseFloat(value) || 0 
        : value
    };
    setLines(updatedLines);
  };

  const calculateLineTotal = (line: LineCharge): number => {
    const planDiscountAmount = line.planDiscountType === 'percentage' 
      ? line.planCost * (line.planDiscount / 100)
      : line.planDiscount;
      
    return (
      line.planCost - 
      planDiscountAmount + 
      line.devicePayment - 
      line.deviceCredit + 
      line.protection + 
      line.surcharges + 
      line.taxes
    );
  };

  const calculateBillTotal = (): number => {
    const linesTotal = lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
    return includeAccountFees ? linesTotal + accountFees : linesTotal;
  };

  const toggleDiscountType = (index: number) => {
    const updatedLines = [...lines];
    updatedLines[index].planDiscountType = updatedLines[index].planDiscountType === 'fixed' ? 'percentage' : 'fixed';
    setLines(updatedLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedData = {
      accountNumber: accountNumber || 'Manual Entry',
      billingPeriod: billingPeriod || new Date().toLocaleDateString(),
      totalAmount: calculateBillTotal(),
      phoneLines: lines.map(line => {
        const planDiscountAmount = line.planDiscountType === 'percentage' 
          ? line.planCost * (line.planDiscount / 100)
          : line.planDiscount;
          
        return {
          phoneNumber: line.phoneNumber || 'Unknown',
          deviceName: line.deviceName || 'Smartphone',
          planName: line.planName,
          monthlyTotal: calculateLineTotal(line),
          details: {
            planCost: line.planCost,
            planDiscount: planDiscountAmount,
            planDiscountType: line.planDiscountType,
            devicePayment: line.devicePayment,
            deviceCredit: line.deviceCredit,
            protection: line.protection,
            surcharges: line.surcharges,
            taxes: line.taxes
          }
        };
      })
    };

    if (includeAccountFees && accountFees > 0) {
      // Add account fees as a separate "line" for display purposes
      formattedData.phoneLines.push({
        phoneNumber: 'Account Fees',
        deviceName: '',
        planName: 'Account-Level Charges',
        monthlyTotal: accountFees,
        details: {
          planCost: accountFees,
          planDiscount: 0,
          devicePayment: 0,
          deviceCredit: 0,
          protection: 0,
          surcharges: 0,
          taxes: 0
        }
      });
    }
    
    onSubmit(formattedData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Enter Your Verizon Bill Details</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Account Number (Optional)</label>
            <Input 
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="e.g. 123456789-00001"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Billing Period (Optional)</label>
            <Input 
              value={billingPeriod}
              onChange={e => setBillingPeriod(e.target.value)}
              placeholder="e.g. Jan 12 - Feb 11, 2025"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="accountFees" 
            checked={includeAccountFees}
            onCheckedChange={(checked) => setIncludeAccountFees(checked as boolean)}
          />
          <label htmlFor="accountFees" className="text-sm font-medium">
            Include additional account-level fees
          </label>
        </div>
        
        {includeAccountFees && (
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">Account-Level Fees ($)</label>
              <Input 
                type="number"
                value={accountFees.toString()}
                onChange={e => setAccountFees(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
              />
              <p className="text-xs text-gray-500">
                Include late fees, account charges, and any other fees not specific to a phone line
              </p>
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-4">Phone Lines</h3>
          
          {lines.map((line, index) => (
            <div key={index} className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Line {index + 1}</h4>
                {lines.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeLine(index)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input 
                    value={line.phoneNumber}
                    onChange={e => updateLine(index, 'phoneNumber', e.target.value)}
                    placeholder="e.g. 555-123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Name</label>
                  <Input 
                    value={line.deviceName}
                    onChange={e => updateLine(index, 'deviceName', e.target.value)}
                    placeholder="e.g. iPhone 15"
                  />
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">Plan Name</label>
                <Select 
                  value={line.planName} 
                  onValueChange={value => updateLine(index, 'planName', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map(plan => (
                      <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan Cost ($)</label>
                  <Input 
                    type="number"
                    value={line.planCost.toString()}
                    onChange={e => updateLine(index, 'planCost', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan Discount</label>
                  <div className="flex">
                    <Input 
                      type="number"
                      value={line.planDiscount.toString()}
                      onChange={e => updateLine(index, 'planDiscount', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      className="rounded-r-none"
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      className="rounded-l-none border-l-0"
                      onClick={() => toggleDiscountType(index)}
                    >
                      {line.planDiscountType === 'fixed' ? <DollarSign className="h-4 w-4" /> : <Percent className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {line.planDiscountType === 'fixed' ? 'Fixed $ amount' : 'Percentage %'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Payment ($)</label>
                  <Input 
                    type="number"
                    value={line.devicePayment.toString()}
                    onChange={e => updateLine(index, 'devicePayment', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device Credit ($)</label>
                  <Input 
                    type="number"
                    value={line.deviceCredit.toString()}
                    onChange={e => updateLine(index, 'deviceCredit', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Protection ($)</label>
                  <Input 
                    type="number"
                    value={line.protection.toString()}
                    onChange={e => updateLine(index, 'protection', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Surcharges ($)</label>
                  <Input 
                    type="number"
                    value={line.surcharges.toString()}
                    onChange={e => updateLine(index, 'surcharges', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Taxes ($)</label>
                  <Input 
                    type="number"
                    value={line.taxes.toString()}
                    onChange={e => updateLine(index, 'taxes', e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Line Total</label>
                  <div className="h-10 px-3 py-2 rounded-md border bg-gray-100 flex items-center">
                    ${calculateLineTotal(line).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button 
            type="button" 
            variant="outline"
            onClick={addLine}
            className="w-full mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Line
          </Button>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-medium">Bill Total</span>
            <span className="text-xl font-semibold">${calculateBillTotal().toFixed(2)}</span>
          </div>
        </div>
        
        <Button type="submit" className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Analyze Bill
        </Button>
      </form>
    </div>
  );
}
