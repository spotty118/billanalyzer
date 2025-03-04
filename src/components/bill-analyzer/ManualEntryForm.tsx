
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash, Save } from 'lucide-react';
import { verizonPlansData, getPlanPrice } from '@/data/verizonPlans';

interface LineCharge {
  phoneNumber: string;
  deviceName: string;
  planName: string;
  planCost: number;
  planDiscount: number;
  planDiscountType: 'fixed' | 'percentage';
  protection: number;
}

interface ManualEntryFormProps {
  onSubmit: (data: {
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
        protection: number;
      }
    }>
  }) => void;
}

export function ManualEntryForm({ onSubmit }: ManualEntryFormProps) {
  const [lines, setLines] = useState<LineCharge[]>([
    {
      phoneNumber: '',
      deviceName: '',
      planName: 'Unlimited Plus',
      planCost: verizonPlansData['unlimited-plus'].prices[1],
      planDiscount: 0,
      planDiscountType: 'fixed',
      protection: 0
    }
  ]);

  const planOptions = Object.values(verizonPlansData).map(plan => plan.name);

  const addLine = () => {
    const lineCount = lines.length + 1;
    const defaultPlanId = 'unlimited-plus';
    const defaultPlanName = verizonPlansData[defaultPlanId].name;
    const planCost = getPlanPrice(defaultPlanId, lineCount);
    
    setLines([...lines, {
      phoneNumber: '',
      deviceName: '',
      planName: defaultPlanName,
      planCost: planCost,
      planDiscount: 0,
      planDiscountType: 'fixed',
      protection: 0
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
      line.protection
    );
  };

  const calculateBillTotal = (): number => {
    return lines.reduce((sum, line) => sum + calculateLineTotal(line), 0);
  };

  const toggleDiscountType = (index: number) => {
    const updatedLines = [...lines];
    updatedLines[index].planDiscountType = updatedLines[index].planDiscountType === 'fixed' ? 'percentage' : 'fixed';
    setLines(updatedLines);
  };

  const updatePlanName = (index: number, planName: string) => {
    const planId = Object.keys(verizonPlansData).find(
      key => verizonPlansData[key].name === planName
    );
    
    if (!planId) return;
    
    const lineCount = lines.length;
    const planCost = getPlanPrice(planId, lineCount);
    
    const updatedLines = [...lines];
    updatedLines[index] = {
      ...updatedLines[index],
      planName,
      planCost
    };
    
    setLines(updatedLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedData = {
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
            protection: line.protection,
            devicePayment: 0,
            deviceCredit: 0,
            surcharges: 0,
            taxes: 0
          }
        };
      })
    };
    
    onSubmit(formattedData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Enter Your Verizon Bill Details</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
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
                  onValueChange={value => updatePlanName(index, value)}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="text-sm font-medium">Plan Discount ($)</label>
                  <Input 
                    type="number"
                    value={line.planDiscount.toString()}
                    onChange={e => updateLine(index, 'planDiscount', e.target.value)}
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
                
                <div className="space-y-2 md:col-span-3">
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
