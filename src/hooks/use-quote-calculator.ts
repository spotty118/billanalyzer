
import { useMemo } from 'react';
import { Plan, QuoteCalculation } from '@/types';
import { z } from 'zod';

const QuoteInputSchema = z.object({
  plan: z.object({
    id: z.string(),
    basePrice: z.number(),
    multiLineDiscounts: z.object({
      lines2: z.number(),
      lines3: z.number(),
      lines4: z.number(),
      lines5Plus: z.number(),
    }),
  }),
  lines: z.number().int().min(1).max(12),
  streamingBill: z.number().optional(),
  selectedPerks: z.array(z.string()).optional(),
});

interface QuoteError {
  message: string;
  code: string;
}

// Non-hook calculation function
const calculateQuote = (
  plan: Plan, 
  lines: number, 
  streamingBill: number = 0,
  selectedPerks: string[] = []
): QuoteCalculation | null => {
  if (!plan || lines <= 0) return null;

  const getLinePrice = (numLines: number): number => {
    if (numLines === 1) return plan.basePrice;
    if (numLines === 2) return plan.multiLineDiscounts.lines2;
    if (numLines === 3) return plan.multiLineDiscounts.lines3;
    if (numLines === 4) return plan.multiLineDiscounts.lines4;
    return plan.multiLineDiscounts.lines5Plus;
  };

  const linePrice = getLinePrice(lines);
  const monthlyTotal = lines * linePrice;
  const hasDiscount = lines > 1;

  // Calculate perks value
  const perksValue = selectedPerks.length * 10; // $10 value per perk
  const streamingSavings = streamingBill;
  
  // Calculate annual savings if applicable
  const annualSavings = hasDiscount
    ? (plan.basePrice * lines * 12) - (monthlyTotal * 12)
    : 0;

  // Calculate total savings including streaming and perks
  const totalSavings = annualSavings + (streamingSavings * 12) + (perksValue * 12);

  return {
    linePrice,
    total: monthlyTotal,
    hasDiscount,
    annualSavings,
    selectedPerks,
    breakdown: {
      subtotal: plan.basePrice * lines,
      discount: hasDiscount ? (plan.basePrice * lines) - monthlyTotal : 0,
      total: monthlyTotal,
      streamingSavings,
      totalSavings,
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

      const calculation = calculateQuote(selectedPlan, lines, streamingBill, selectedPerks);
      
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
    selectedPlan?.basePrice, 
    selectedPlan?.multiLineDiscounts, 
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
  const currentCalc = calculateQuote(currentPlan, lines);
  const newCalc = calculateQuote(newPlan, lines, streamingBill, selectedPerks);

  if (!currentCalc || !newCalc) return 0;

  return Math.max(0, (currentCalc.total * 12) - (newCalc.total * 12));
};
