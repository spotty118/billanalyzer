
import { z } from 'zod';

export const StreamingQuality = z.enum(['480p', '720p', '1080p', '4K']);
export type StreamingQuality = z.infer<typeof StreamingQuality>;

export const PlanType = z.enum(['consumer', 'business']);
export type PlanType = z.infer<typeof PlanType>;

export const PromotionType = z.enum(['device', 'plan', 'trade-in']);
export type PromotionType = z.infer<typeof PromotionType>;

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  basePrice: z.number(),
  price_1_line: z.number(),
  price_2_line: z.number(),
  price_3_line: z.number(),
  price_4_line: z.number(),
  price_5plus_line: z.number(),
  features: z.array(z.string()),
  type: PlanType,
  dataAllowance: z.object({
    premium: z.union([z.number(), z.literal('unlimited')]),
    hotspot: z.number().optional(),
  }),
  streamingQuality: StreamingQuality,
  autopayDiscount: z.number().optional(),
  paperlessDiscount: z.number().optional(),
  planLevel: z.enum(['welcome', 'plus', 'unlimited']).optional()
});

export type Plan = z.infer<typeof PlanSchema>;

export const PromotionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  expires: z.string(),
  type: PromotionType,
  value: z.string(),
  terms: z.array(z.string()).optional(),
  eligiblePlans: z.array(z.string()).optional(),
  stackable: z.boolean().optional(),
  version: z.string().optional(),
});

export type Promotion = z.infer<typeof PromotionSchema>;
