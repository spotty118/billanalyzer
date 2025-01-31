import { useMemo } from 'react';
import { Plan, QuoteCalculation } from '@/types';

export const useQuoteCalculator = (
  selectedPlan: Plan | null,
  lines: number
): QuoteCalculation | null => {
  return useMemo(() => {
    if (!selectedPlan || lines <= 0) return null;

    const getLinePrice = (numLines: number): number => {
      if (numLines === 1) return selectedPlan.basePrice;
      if (numLines === 2) return selectedPlan.multiLineDiscounts.lines2;
      if (numLines === 3) return selectedPlan.multiLineDiscounts.lines3;
      if (numLines === 4) return selectedPlan.multiLineDiscounts.lines4;
      return selectedPlan.multiLineDiscounts.lines5Plus;
    };

    const linePrice = getLinePrice(lines);
    const total = lines * linePrice;
    const hasDiscount = lines > 1;

    return {
      linePrice,
      total,
      hasDiscount,
    };
  }, [selectedPlan, lines]);
};