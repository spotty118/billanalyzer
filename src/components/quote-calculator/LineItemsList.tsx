
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LineItem } from "./LineItem";
import { LinePlan, Plan } from "@/types";

interface LineItemsListProps {
  linePlans: LinePlan[];
  availablePlans: Plan[];
  allSelectedPerks: string[];
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onUpdatePlan: (index: number, value: string) => void;
  onUpdatePerks: (index: number, perks: string[]) => void;
  maxLines: number;
}

export function LineItemsList({
  linePlans,
  availablePlans,
  allSelectedPerks,
  onAddLine,
  onRemoveLine,
  onUpdatePlan,
  onUpdatePerks,
  maxLines
}: LineItemsListProps) {
  return (
    <div className="space-y-4">
      {linePlans.map((linePlan, index) => (
        <LineItem
          key={index}
          index={index}
          linePlan={linePlan}
          plans={availablePlans}
          allSelectedPerks={allSelectedPerks}
          onRemove={() => onRemoveLine(index)}
          onPlanChange={(value) => onUpdatePlan(index, value)}
          onPerksChange={(perks) => onUpdatePerks(index, perks)}
          showRemoveButton={linePlans.length > 1}
        />
      ))}

      <Button
        variant="outline"
        onClick={onAddLine}
        className="w-full border-dashed"
        disabled={linePlans.length >= maxLines}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Line {linePlans.length >= maxLines && `(Maximum ${maxLines} lines)`}
      </Button>
    </div>
  );
}
