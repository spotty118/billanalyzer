import { Plan } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/data/verizonPlans";

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

  const getPlanBasePrice = (plan: Plan) => {
    const planName = plan.name.toLowerCase();
    if (planName.includes('ultimate')) return 90;
    if (planName.includes('plus')) return 80;
    if (planName.includes('welcome')) return 65;
    return plan.basePrice;
  };

  const getDisplayPrice = (plan: Plan) => {
    const basePrice = getPlanBasePrice(plan);
    return `${plan.name} - ${formatCurrency(basePrice)}/line`;
  };

  const isEntertainmentPerkDisabled = (perk: string) => {
    if ((perk === 'disney' || perk === 'netflix') && !selectedPerks.includes(perk)) {
      return allSelectedPerks.includes(perk);
    }
    return false;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Plan</label>
        <Select onValueChange={onPlanChange} value={selectedPlan}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Choose a plan">
              {selectedPlan && getDisplayPrice(plans.find(p => p.id === selectedPlan)!)}
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
          {[
            ['apple_music', 'Apple Music'],
            ['apple_one', 'Apple One'],
            ['disney', 'Disney Bundle'],
            ['google', 'Google One'],
            ['netflix', 'Netflix & Max (with Ads)'],
            ['cloud', 'Cloud'],
            ['youtube', 'YouTube'],
            ['hotspot', 'Hotspot'],
            ['travelpass', 'TravelPass']
          ].map(([value, label]) => (
            <div key={value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={value}
                checked={selectedPerks.includes(value)}
                disabled={isEntertainmentPerkDisabled(value)}
                onChange={(e) => {
                  const newPerks = e.target.checked 
                    ? [...selectedPerks, value]
                    : selectedPerks.filter(p => p !== value);
                  onPerksChange(newPerks);
                }}
              />
              <label htmlFor={value} className="text-sm">
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
