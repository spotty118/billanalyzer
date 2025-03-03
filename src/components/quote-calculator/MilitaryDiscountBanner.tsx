
import { Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export function MilitaryDiscountBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 my-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <ShieldCheck className="h-6 w-6 text-blue-500 mr-3" />
          <div>
            <h3 className="font-medium text-blue-800">Military Discount</h3>
            <p className="text-sm text-blue-600">Special offers for military personnel</p>
          </div>
        </div>
        <div className="flex items-center">
          <Button 
            variant="outline" 
            className="bg-white text-gray-500 border-gray-300 hover:bg-gray-50 cursor-not-allowed"
            disabled
          >
            Apply Discount
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="ml-2 h-5 w-5 text-blue-400 hover:text-blue-600 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent className="bg-blue-800 text-white border-blue-900">
                <p>Military discount feature is currently under development</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
