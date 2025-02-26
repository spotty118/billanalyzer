import { describe, it, expect } from 'vitest';
import {
  calculateLinePriceForPosition,
  calculateSavingsBreakdown,
  isPerkSelectionValid
} from './pricing-calculator';

describe('pricing-calculator utility', () => {
  describe('calculateLinePriceForPosition', () => {
    it('should return correct price for Ultimate plan with 1 line', () => {
      expect(calculateLinePriceForPosition('ultimate unlimited', 1)).toBe(90);
    });

    it('should return correct price for Ultimate plan with 3 lines', () => {
      expect(calculateLinePriceForPosition('ultimate unlimited', 3)).toBe(65);
    });

    it('should return correct price for Plus plan with 2 lines', () => {
      expect(calculateLinePriceForPosition('plus plan', 2)).toBe(70);
    });

    it('should return correct price for Plus plan with 5 lines', () => {
      expect(calculateLinePriceForPosition('plus plan', 5)).toBe(42);
    });

    it('should return correct price for Welcome plan with 4 lines', () => {
      expect(calculateLinePriceForPosition('welcome', 4)).toBe(30);
    });

    it('should return correct price for Welcome plan with 6+ lines', () => {
      expect(calculateLinePriceForPosition('welcome unlimited', 6)).toBe(27);
      expect(calculateLinePriceForPosition('welcome unlimited', 10)).toBe(27);
    });

    it('should return 0 for unknown plans', () => {
      expect(calculateLinePriceForPosition('unknown plan', 1)).toBe(0);
    });

    it('should handle case insensitivity', () => {
      expect(calculateLinePriceForPosition('ULTIMATE', 1)).toBe(90);
      expect(calculateLinePriceForPosition('Plus', 1)).toBe(80);
    });
  });

  describe('calculateSavingsBreakdown', () => {
    it('should calculate correct savings for a single line with no perks', () => {
      const breakdown = calculateSavingsBreakdown(90, 1, 0, 0);
      expect(breakdown.subtotal).toBe(100); // 90 + 10 autopay
      expect(breakdown.total).toBe(90);
      expect(breakdown.discount).toBe(10);
      expect(breakdown.annualSavings).toBe(120); // 10 × 12
    });

    it('should calculate correct savings for multiple lines with perks', () => {
      const breakdown = calculateSavingsBreakdown(65, 3, 6, 20);
      
      // Base costs: (65 × 3) = 195
      // Autopay: 10 × 3 = 30
      // Perks: 6 × 10 = 60
      
      expect(breakdown.subtotal).toBe(285); // 195 + 30 + 60
      expect(breakdown.total).toBe(255); // 195 + 60
      expect(breakdown.discount).toBe(30); // 285 - 255
      
      // Annual savings: 
      // - Autopay discount: 30 × 12 = 360
      // - Streaming savings: 20 × 12 = 240
      // - Perks value: 60 × 12 = 720
      
      expect(breakdown.annualSavings).toBe(1320); // (30 + 20 + 60) × 12
    });

    it('should handle zero streaming cost', () => {
      const breakdown = calculateSavingsBreakdown(80, 2, 2, 0);
      expect(breakdown.streamingSavings).toBe(0);
      expect(breakdown.annualSavings).toBe(600); // (20 + 20) × 12
    });
  });

  describe('isPerkSelectionValid', () => {
    it('should return true for valid non-restricted perk selection', () => {
      expect(isPerkSelectionValid(['apple_one', 'cloud'], ['apple_one'], 'hotspot')).toBe(true);
    });

    it('should return true if the perk is already selected on the current line', () => {
      expect(isPerkSelectionValid(['netflix'], ['netflix'], 'netflix')).toBe(true);
    });

    it('should return false if entertainment perk is already selected on another line', () => {
      expect(isPerkSelectionValid(['disney'], [], 'disney')).toBe(false);
      expect(isPerkSelectionValid(['netflix', 'cloud'], [], 'netflix')).toBe(false);
    });

    it('should return true for non-entertainment perks', () => {
      expect(isPerkSelectionValid(['disney', 'netflix'], [], 'cloud')).toBe(true);
      expect(isPerkSelectionValid(['apple_music', 'netflix'], [], 'travelpass')).toBe(true);
    });

    it('should handle multiple entertainment perks correctly', () => {
      const allSelectedPerks = ['disney', 'hotspot', 'cloud'];
      const currentLinePerks: string[] = [];
      
      expect(isPerkSelectionValid(allSelectedPerks, currentLinePerks, 'netflix')).toBe(true);
      expect(isPerkSelectionValid(allSelectedPerks, currentLinePerks, 'disney')).toBe(false);
      expect(isPerkSelectionValid(allSelectedPerks, currentLinePerks, 'youtube')).toBe(true);
      expect(isPerkSelectionValid(allSelectedPerks, currentLinePerks, 'apple_music')).toBe(true);
    });
  });
});
