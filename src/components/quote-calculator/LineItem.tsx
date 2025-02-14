
import { Button } from "@/components/ui/button";
import { Minus } from "lucide-react";
import { PlanSelector } from "./PlanSelector";
import { Plan } from "@/types";

interface LineItemProps {
  index: number;
  linePlan: { plan: string; perks: string[] };
  plans: Plan[];
  allSelectedPerks: string[];
  onRemove: () => void;
  onPlanChange: (value: string) => void;
  onPerksChange: (perks: string[]) => void;
  showRemoveButton: boolean;
}

export function LineItem({
  index,
  linePlan,
  plans,
  allSelectedPerks,
  onRemove,
  onPlanChange,
  onPerksChange,
  showRemoveButton,
}: LineItemProps) {
  return (
    <div className="p-6 border rounded-lg space-y-4 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-700">Line {index + 1}</h3>
        {showRemoveButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-gray-500 hover:text-gray-700"
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <PlanSelector
        selectedPlan={linePlan.plan}
        onPlanChange={onPlanChange}
        onPerksChange={onPerksChange}
        plans={plans}
        selectedPerks={linePlan.perks}
        allSelectedPerks={allSelectedPerks}
      />
    </div>
  );
}
