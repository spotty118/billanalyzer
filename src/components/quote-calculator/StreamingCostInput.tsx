
import { Input } from "@/components/ui/input";

interface StreamingCostInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function StreamingCostInput({ value, onChange }: StreamingCostInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Current Monthly Streaming Cost</label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter monthly streaming cost"
        min="0"
        step="0.01"
        className="mt-1"
      />
    </div>
  );
}
