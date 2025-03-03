
import { AlertCircle } from "lucide-react";

interface ComparisonFootnoteProps {
  carrierName: string;
}

export function ComparisonFootnote({ carrierName }: ComparisonFootnoteProps) {
  return (
    <div className="mt-6 bg-blue-50 p-3 rounded-md border border-blue-100">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Note:</p>
          <p>This is an estimate only. {carrierName} plans offer different coverage and features. Visit the {carrierName} website for the most current plan information.</p>
        </div>
      </div>
    </div>
  );
}
