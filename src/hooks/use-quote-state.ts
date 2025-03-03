
import { useState, useEffect, useMemo } from "react";
import { Plan, ApiError, LinePlan } from "@/types";
import { fetchPlans } from "@/utils/quote-api";
import { 
  MAX_ALLOWED_LINES, 
  getAllSelectedPerks, 
  calculateTotalPrice 
} from "@/utils/line-plan-utils";

// Re-export MAX_ALLOWED_LINES for backward compatibility
export { MAX_ALLOWED_LINES } from "@/utils/line-plan-utils";

/**
 * Custom hook to manage the state and calculations for the quote calculator
 * @returns An object containing state and methods for quote calculation
 */
export function useQuoteState() {
  const [linePlans, setLinePlans] = useState<LinePlan[]>([{ plan: "", perks: [] }]);
  const [streamingBill, setStreamingBill] = useState("");
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Load plans on initial render
  useEffect(() => {
    loadPlans();
  }, []);

  // Async function to load plans
  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    const { plans, error: apiError } = await fetchPlans();
    setAvailablePlans(plans);
    setError(apiError);
    setLoading(false);
  };

  // Line management functions
  const addLine = () => {
    if (linePlans.length < MAX_ALLOWED_LINES) {
      setLinePlans([...linePlans, { plan: "", perks: [] }]);
    }
  };

  const removeLine = (index: number) => {
    setLinePlans(linePlans.filter((_, i) => i !== index));
  };

  const updateLinePlan = (index: number, plan: string) => {
    const newLinePlans = [...linePlans];
    newLinePlans[index] = { ...newLinePlans[index], plan };
    setLinePlans(newLinePlans);
  };

  const updateLinePerks = (index: number, perks: string[]) => {
    const newLinePlans = [...linePlans];
    newLinePlans[index] = { ...newLinePlans[index], perks };
    setLinePlans(newLinePlans);
  };

  const resetQuote = () => {
    setLinePlans([{ plan: "", perks: [] }]);
    setStreamingBill("");
  };

  // Derived values with memoization
  const allSelectedPerks = useMemo(() => 
    getAllSelectedPerks(linePlans),
    [linePlans]
  );
  
  const streamingBillValue = useMemo(() => {
    const parsed = parseFloat(streamingBill);
    return isNaN(parsed) ? 0 : parsed;
  }, [streamingBill]);

  // Calculate totals
  const totalCalculation = useMemo(() => 
    calculateTotalPrice(linePlans, availablePlans, streamingBillValue),
    [linePlans, availablePlans, streamingBillValue]
  );

  return {
    linePlans,
    streamingBill,
    availablePlans,
    loading,
    error,
    totalCalculation,
    allSelectedPerks,
    addLine,
    removeLine,
    updateLinePlan,
    updateLinePerks,
    setStreamingBill,
    resetQuote,
    retry: loadPlans,
    maxLines: MAX_ALLOWED_LINES
  };
}
