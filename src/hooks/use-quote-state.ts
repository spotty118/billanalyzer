import { useState, useEffect, useMemo } from "react";
import { Plan, ApiError, LinePlan } from "@/types";
import { getPlans } from "@/data/verizonPlans";
import { calculateLinePriceForPosition, calculateSavingsBreakdown } from "@/utils/pricing-calculator";

// Maximum number of lines allowed in a quote
export const MAX_ALLOWED_LINES = 12;

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

  /**
   * Handles API errors
   */
  const handleApiError = (err: unknown): ApiError => {
    console.error('Error occurred:', err);
    return {
      message: 'Failed to load plans. Please try again later.',
      details: err instanceof Error ? err.message : 'Unknown error occurred'
    };
  };

  /**
   * Fetches plans from the API
   */
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const plans = await getPlans();
      if (!Array.isArray(plans)) {
        throw new Error('Invalid response format');
      }
      // Filter out plans with undefined planLevel or set a default value
      const validPlans = plans.filter(plan => plan.planLevel !== undefined) as Plan[];
      setAvailablePlans(validPlans);
      setLoading(false);
    } catch (err) {
      setError(handleApiError(err));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  /**
   * Adds a new line to the quote
   */
  const addLine = () => {
    if (linePlans.length < MAX_ALLOWED_LINES) {
      setLinePlans([...linePlans, { plan: "", perks: [] }]);
    }
  };

  /**
   * Removes a line from the quote
   * @param index - The index of the line to remove
   */
  const removeLine = (index: number) => {
    setLinePlans(linePlans.filter((_, i) => i !== index));
  };

  /**
   * Updates the plan for a specific line
   * @param index - The index of the line to update
   * @param plan - The new plan ID
   */
  const updateLinePlan = (index: number, plan: string) => {
    const newLinePlans = [...linePlans];
    newLinePlans[index] = { ...newLinePlans[index], plan };
    setLinePlans(newLinePlans);
  };

  /**
   * Updates the perks for a specific line
   * @param index - The index of the line to update
   * @param perks - The new perks array
   */
  const updateLinePerks = (index: number, perks: string[]) => {
    const newLinePlans = [...linePlans];
    newLinePlans[index] = { ...newLinePlans[index], perks };
    setLinePlans(newLinePlans);
  };

  /**
   * Resets the quote calculator to its initial state
   */
  const resetQuote = () => {
    setLinePlans([{ plan: "", perks: [] }]);
    setStreamingBill("");
  };

  /**
   * Calculates all selected perks across all lines
   */
  const allSelectedPerks = useMemo(() => 
    linePlans.flatMap(lp => lp.perks),
    [linePlans]
  );
  
  /**
   * Convert streaming bill to number safely
   */
  const streamingBillValue = useMemo(() => {
    const parsed = parseFloat(streamingBill);
    return isNaN(parsed) ? 0 : parsed;
  }, [streamingBill]);

  /**
   * Calculates the total price and savings for the selected plans and perks
   */
  const totalCalculation = useMemo(() => {
    const selectedPlans = linePlans
      .filter(lp => lp.plan)
      .map(lp => {
        const plan = availablePlans.find(p => p.id === lp.plan);
        if (!plan) return null;
        
        return {
          plan,
          perks: lp.perks
        };
      })
      .filter(item => item !== null) as { plan: Plan; perks: string[] }[];

    if (selectedPlans.length === 0) return null;

    let totalMonthly = 0;
    let totalWithoutAutopay = 0;
    const streamingBillNum = streamingBillValue;
    const totalLines = selectedPlans.length;
    
    // Fix: Count the actual number of perks across all selected lines
    const totalPerksCount = selectedPlans.reduce((count, item) => count + item.perks.length, 0);

    // Calculate line prices
    const linePrices = selectedPlans.map(({ plan, perks }) => {
      const planName = plan.name.toLowerCase();
      // Fix Error #1: Use the correct line pricing calculation
      const linePrice = calculateLinePriceForPosition(planName, totalLines);
      const perksPrice = perks.length * 10;
      
      // Add to running totals
      totalMonthly += linePrice + perksPrice;
      // Add $10 autopay discount per line to the without-discount total
      totalWithoutAutopay += linePrice + 10 + perksPrice;
      
      return {
        plan: plan.name,
        price: linePrice + perksPrice,
        perks
      };
    });

    // Fix Error #2: Pass the base line price, not the average total price
    // We need to get the base price from the first line without perks
    const baseLinePrice = selectedPlans.length > 0 ? 
      calculateLinePriceForPosition(selectedPlans[0].plan.name.toLowerCase(), totalLines) : 0;
      
    const breakdown = calculateSavingsBreakdown(
      baseLinePrice, // Fix: Pass the base line price, not the average total price
      totalLines,
      totalPerksCount,
      streamingBillNum
    );

    return {
      linePrices,
      total: breakdown.total,
      hasDiscount: breakdown.discount > 0, // Fix: Use consistent discount logic
      selectedPerks: allSelectedPerks,
      annualSavings: breakdown.annualSavings,
      breakdown
    };
  }, [linePlans, availablePlans, streamingBillValue, allSelectedPerks]);

  /**
   * Retry loading plans if there was an error
   */
  const retry = () => {
    fetchPlans();
  };

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
    retry,
    maxLines: MAX_ALLOWED_LINES
  };
}
