
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

const calculateQuote = (
  plan: Plan, 
  lines: number, 
  streamingBill: number = 0,
  selectedPerks: string[] = []
): QuoteCalculation | null => {
  if (!plan || lines <= 0) return null;

  // Get the appropriate price per line based on number of lines
  let pricePerLine: number;
  if (lines === 1) {
    pricePerLine = plan.price_1_line;
  } else if (lines === 2) {
    pricePerLine = plan.price_2_line;
  } else if (lines === 3) {
    pricePerLine = plan.price_3_line;
  } else if (lines === 4) {
    pricePerLine = plan.price_4_line;
  } else {
    pricePerLine = plan.price_5plus_line;
  }
  
  // Calculate monthly total
  const monthlyTotal = pricePerLine * lines;
  
  // Calculate perks value
  const perksValue = selectedPerks.length * 10; // $10 value per perk
  const streamingSavings = streamingBill;
  
  // Calculate total savings including streaming and perks
  const annualSavings = (streamingSavings * 12) + (perksValue * 12);

  return {
    linePrice: pricePerLine,
    total: monthlyTotal,
    hasDiscount: true, // Always true since prices include autopay discount
    annualSavings,
    selectedPerks,
    breakdown: {
      subtotal: monthlyTotal, // No longer calculating a separate subtotal
      discount: 0, // No longer calculating discounts since prices already include them
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
  const currentCalc = calculateQuote(currentPlan, lines);
  const newCalc = calculateQuote(newPlan, lines, streamingBill, selectedPerks);

  if (!currentCalc || !newCalc) return 0;

  return Math.max(0, (currentCalc.total * 12) - (newCalc.total * 12));
};
