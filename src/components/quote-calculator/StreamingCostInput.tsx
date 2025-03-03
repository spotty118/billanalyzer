
import { Input } from "@/components/ui/input";
import { TvIcon } from "lucide-react";

interface StreamingCostInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function StreamingCostInput({ value, onChange }: StreamingCostInputProps) {
  return (
    <div className="space-y-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center mb-2">
        <TvIcon className="h-5 w-5 text-blue-500 mr-2" />
        <label className="text-sm font-medium text-gray-700">Current Monthly Streaming Cost</label>
      </div>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter monthly streaming cost"
          min="0"
          step="0.01"
          className="pl-7 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Including services like Netflix, Hulu, Disney+, etc.
      </p>
    </div>
  );
}
