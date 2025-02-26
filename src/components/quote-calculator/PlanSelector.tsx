import { Plan, PerkType } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/data/verizonPlans";
import { isPerkSelectionValid, calculateLinePriceForPosition } from "@/utils/pricing-calculator";
import { PERKS } from "@/config/perks";

interface PlanSelectorProps {
  selectedPlan: string;
  onPlanChange: (value: string) => void;
  onPerksChange: (perks: string[]) => void;
  plans: Plan[];
  selectedPerks: string[];
  allSelectedPerks?: string[];
}

export function PlanSelector({
  selectedPlan,
  onPlanChange,
  onPerksChange,
  plans,
  selectedPerks,
  allSelectedPerks = [],
}: PlanSelectorProps) {
  const myPlans = plans.filter(plan => {
    const planName = plan.name.toLowerCase();
    return plan.type === 'consumer' && 
           (planName.includes('welcome') || 
            planName.includes('plus') || 
            planName.includes('ultimate'));
  });

  const getDisplayPrice = (plan: Plan | undefined) => {
    if (!plan) return "Select a plan";
    // Use the common calculation function
    const basePrice = calculateLinePriceForPosition(plan.name, 1);
    return `${plan.name} - ${formatCurrency(basePrice)}/line`;
  };

  const isEntertainmentPerkDisabled = (perk: string) => {
    return !isPerkSelectionValid(allSelectedPerks, selectedPerks, perk);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Plan</label>
        <Select onValueChange={onPlanChange} value={selectedPlan}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Choose a plan">
              {selectedPlan && getDisplayPrice(plans.find(p => p.id === selectedPlan))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white">
            {myPlans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {getDisplayPrice(plan)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Perks ($10/month each)</label>
        <div className="space-y-2 border rounded-md p-4">
          {PERKS.map(({ id, label }) => (
            <div key={id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={id}
                checked={selectedPerks.includes(id)}
                disabled={isEntertainmentPerkDisabled(id)}
                onChange={(e) => {
                  const newPerks = e.target.checked 
                    ? [...selectedPerks, id]
                    : selectedPerks.filter(p => p !== id);
                  onPerksChange(newPerks);
                }}
              />
              <label htmlFor={id} className="text-sm">
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
