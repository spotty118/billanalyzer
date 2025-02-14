
import { useMemo } from 'react';
import { Plan, QuoteCalculation } from '@/types';
import { z } from 'zod';

const QuoteInputSchema = z.object({
  plan: z.object({
    id: z.string(),
    price_1_line: z.number().optional(),
    price_2_line: z.number().optional(),
    price_3_line: z.number().optional(),
    price_4_line: z.number().optional(),
    price_5plus_line: z.number().optional(),
    autopayDiscount: z.number().optional(),
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
  const getPricePerLine = (numLines: number): number => {
    if (numLines >= 5) return plan.price_5plus_line;
    if (numLines === 4) return plan.price_4_line;
    if (numLines === 3) return plan.price_3_line;
    if (numLines === 2) return plan.price_2_line;
    return plan.price_1_line;
  };

  // Get price per line before autopay discount
  const pricePerLine = getPricePerLine(lines);
  
  // Apply autopay discount
  const pricePerLineWithAutopay = pricePerLine - (plan.autopayDiscount || 0);
  
  // Calculate totals
  const subtotal = pricePerLine * lines; // Total without autopay discount
  const totalWithAutopay = pricePerLineWithAutopay * lines;
  const discount = subtotal - totalWithAutopay; // Autopay discount

  // Calculate perks value
  const perksValue = selectedPerks.length * 10; // $10 value per perk
  const streamingSavings = streamingBill;
  
  // Calculate total annual savings including streaming and perks
  const annualSavings = (discount * 12) + (streamingSavings * 12) + (perksValue * 12);

  return {
    linePrice: pricePerLineWithAutopay,
    total: totalWithAutopay,
    hasDiscount: true, // Always true since there's always autopay discount
    annualSavings,
    selectedPerks,
    breakdown: {
      subtotal,
      discount,
      total: totalWithAutopay,
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
    if (!selectedPlan || lines <= 0) {
      return { calculation: null, error: null };
    }

    try {
      QuoteInputSchema.parse({
        plan: selectedPlan,
        lines,
        streamingBill: streamingBill || 0,
        selectedPerks: selectedPerks || [],
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
            message: 'Please enter number of lines (1-12)',
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
    selectedPlan?.autopayDiscount,
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
