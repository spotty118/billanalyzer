
import { formatCurrency } from "@/data/verizonPlans";

export interface USMobilePlan {
  id: string;
  name: string;
  basePrice: number;
  pricePerLine: {
    line1: number;
    line2: number;
    line3: number;
    line4: number;
    line5Plus: number;
  };
  dataAllowance: {
    premium: number | 'unlimited';
    hotspot?: number;
  };
  features: string[];
  streamingPerks: string[];
  streamingQuality: '480p' | '720p' | '1080p' | '4K';
  network: 'Verizon' | 'T-Mobile' | 'Both';
}

// US Mobile plans as of April 2025
export const usMobilePlans: USMobilePlan[] = [
  {
    id: 'premium-unlimited',
    name: 'Premium Unlimited',
    basePrice: 45,
    pricePerLine: {
      line1: 45,
      line2: 30,
      line3: 20,
      line4: 20, 
      line5Plus: 20,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 50,
    },
    features: [
      "Unlimited priority data",
      "Free international roaming",
      "100GB cloud storage",
      "50GB hotspot data",
      "5G Ultra Wideband",
      "Unlimited talk and text"
    ],
    streamingPerks: [
      "Disney+",
      "Hulu",
      "Spotify",
      "One premium perk with 1 line",
      "All premium perks with 3+ lines"
    ],
    streamingQuality: '4K',
    network: 'Verizon'
  },
  {
    id: 'unlimited-basic',
    name: 'Unlimited Basic',
    basePrice: 35,
    pricePerLine: {
      line1: 35,
      line2: 25,
      line3: 15,
      line4: 15,
      line5Plus: 10,
    },
    dataAllowance: {
      premium: 30,
      hotspot: 15,
    },
    features: [
      "30GB premium data",
      "15GB hotspot data",
      "Unlimited talk and text",
      "5G nationwide",
      "WiFi calling"
    ],
    streamingPerks: [
      "One streaming perk with 3+ lines"
    ],
    streamingQuality: '1080p',
    network: 'Verizon'
  },
  {
    id: 'unlimited-bundle',
    name: 'Unlimited Bundle',
    basePrice: 40,
    pricePerLine: {
      line1: 40,
      line2: 30,
      line3: 20,
      line4: 15,
      line5Plus: 15,
    },
    dataAllowance: {
      premium: 100,
      hotspot: 25,
    },
    features: [
      "100GB premium data",
      "25GB hotspot data",
      "Unlimited talk and text",
      "5G Ultra Wideband",
      "WiFi calling",
      "International texting"
    ],
    streamingPerks: [
      "Choice of 2 streaming perks",
      "All streaming perks with 4+ lines"
    ],
    streamingQuality: '1080p',
    network: 'Both' 
  }
];

export function getUSMobilePlanPrice(plan: USMobilePlan, numberOfLines: number): number {
  if (numberOfLines <= 0) return 0;
  
  let pricePerLine;
  switch (numberOfLines) {
    case 1: pricePerLine = plan.pricePerLine.line1; break;
    case 2: pricePerLine = plan.pricePerLine.line2; break;
    case 3: pricePerLine = plan.pricePerLine.line3; break;
    case 4: pricePerLine = plan.pricePerLine.line4; break;
    default: pricePerLine = plan.pricePerLine.line5Plus; break;
  }
  
  return pricePerLine * numberOfLines;
}

export function formatUSMobilePlanPrice(plan: USMobilePlan, numberOfLines: number): string {
  const price = getUSMobilePlanPrice(plan, numberOfLines);
  return formatCurrency(price);
}

export function findBestUSMobileMatch(verizonPlanName: string): string {
  // Match Verizon plans to their closest US Mobile equivalent
  const planName = verizonPlanName.toLowerCase();
  
  if (planName.includes('ultimate')) {
    return 'premium-unlimited';
  } else if (planName.includes('plus')) {
    return 'unlimited-bundle';
  } else {
    return 'unlimited-basic';
  }
}
