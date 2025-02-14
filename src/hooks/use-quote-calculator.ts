import { useMemo } from 'react';
import { Plan, QuoteCalculation } from '@/types';
import { z } from 'zod';

const QuoteInputSchema = z.object({
  plan: z.object({
    id: z.string(),
    basePrice: z.number(),
    price_1_line: z.number(),
    price_2_line: z.number(),
    price_3_line: z.number(),
    price_4_line: z.number(),
    price_5plus_line: z.number(),
  }),
  lines: z.number().int().min(1).max(12),
  streamingBill: z.number().optional(),
  selectedPerks: z.array(z.string()).optional(),
});

interface QuoteError {
  message: string;
  code: string;
}

const getLinePriceForPosition = (planName: string, linePosition: number): number => {
  if (planName.includes('ultimate')) {
    if (linePosition === 1) return 90;
    if (linePosition === 2) return 80;
    if (linePosition === 3) return 65;
    if (linePosition === 4) return 55;
    return 52; // 5+ lines
  }
  if (planName.includes('plus')) {
    if (linePosition === 1) return 80;
    if (linePosition === 2) return 70;
    if (linePosition === 3) return 55;
    if (linePosition === 4) return 45;
    return 42; // 5+ lines
  }
  if (planName.includes('welcome')) {
    if (linePosition === 1) return 65;
    if (linePosition === 2) return 55;
    if (linePosition === 3) return 40;
    if (linePosition === 4) return 30;
    return 27; // 5+ lines
  }
  return 0;
};

const calculateQuote = (
  plans: Plan[], 
  lines: number,
  streamingBill: number = 0,
  selectedPerks: string[] = []
): QuoteCalculation | null => {
  if (!plans || !plans.length || lines <= 0) return null;

  let monthlyTotal = 0;
  let subtotal = 0;

  // Calculate price for each line based on its position
  plans.forEach((plan, index) => {
    const linePosition = index + 1;
    const linePrice = getLinePriceForPosition(plan.name.toLowerCase(), linePosition);
    monthlyTotal += linePrice;
    subtotal += linePrice + 10; // Add $10 for without autopay
  });

  const discount = subtotal - monthlyTotal;
  const perksValue = selectedPerks.length * 10;
  const streamingSavings = streamingBill;
  const annualSavings = (streamingSavings * 12) + (perksValue * 12) + (discount * 12);

  return {
    linePrice: monthlyTotal / lines,
    total: monthlyTotal,
    hasDiscount: true,
    annualSavings,
    selectedPerks,
    breakdown: {
      subtotal,
      discount,
      total: monthlyTotal,
      streamingSavings,
      totalSavings: annualSavings,
    },
  };
};

export const useQuoteCalculator = (
  selectedPlan: Plan | null,
  lines: number,
  streamingBill: number = 0,
  selectedPerks: string[] = []
): { calculation: QuoteCalculation | null; error: QuoteError | null } => {
  return useMemo(() => {
    // Early return if no data
    if (!selectedPlan || lines <= 0) {
      return { calculation: null, error: null };
    }

    try {
      // Validate inputs
      QuoteInputSchema.parse({
        plan: selectedPlan,
        lines,
        streamingBill,
        selectedPerks,
      });

      const calculation = calculateQuote([selectedPlan], lines, streamingBill, selectedPerks);
      
      return {
        calculation,
        error: null,
      };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return {
          calculation: null,
          error: {
            message: 'Invalid input data',
            code: 'VALIDATION_ERROR',
          },
        };
      }

      return {
        calculation: null,
        error: {
          message: 'An unexpected error occurred',
          code: 'CALCULATION_ERROR',
        },
      };
    }
  }, [
    selectedPlan?.id,
    selectedPlan?.price_1_line,
    selectedPlan?.price_2_line,
    selectedPlan?.price_3_line,
    selectedPlan?.price_4_line,
    selectedPlan?.price_5plus_line,
    lines,
    streamingBill,
    selectedPerks
  ]);
};

// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Helper to calculate potential savings between plans
export const calculatePlanSavings = (
  currentPlan: Plan,
  newPlan: Plan,
  lines: number,
  streamingBill: number = 0,
  selectedPerks: string[] = []
): number => {
  const currentCalc = calculateQuote([currentPlan], lines);
  const newCalc = calculateQuote([newPlan], lines, streamingBill, selectedPerks);

  if (!currentCalc || !newCalc) return 0;

  return Math.max(0, (currentCalc.total * 12) - (newCalc.total * 12));
};
