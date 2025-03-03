
import { formatCurrency } from "@/data/verizonPlans";

export interface CarrierPlan {
  id: string;
  carrierId: string;
  carrierName: string;
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
  streamingQuality: '480p' | '720p' | '1080p' | '4K' | 'QHD';
  network: 'Verizon' | 'T-Mobile' | 'Both' | 'AT&T' | 'Proprietary';
  iconName: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

// Alternative Carrier plans
export const alternativeCarrierPlans: CarrierPlan[] = [
  // DarkStar carrier plans (AT&T)
  {
    id: 'darkstar-premium',
    carrierId: 'darkstar',
    carrierName: 'US Mobile DarkStar',
    name: 'Unlimited Premium',
    basePrice: 44,
    pricePerLine: {
      line1: 44,
      line2: 35,
      line3: 25,
      line4: 20, 
      line5Plus: 18,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 'unlimited',
    },
    features: [
      "Truly unlimited, never-throttled premium data (QCI-8)",
      "Unlimited hotspot access",
      "20GB international roaming (90+ countries)",
      "Free network transfers (Teleport)",
      "Annual option: $390/year ($32.50/mo)",
      "Priority network access"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31)",
      "Free Maestro 3 smartphone with 3-month subscription"
    ],
    streamingQuality: 'QHD',
    network: 'AT&T',
    iconName: 'Star',
    discountType: 'percentage',
    discountValue: 15
  },
  // Warp carrier plans (Verizon)
  {
    id: 'warp-premium',
    carrierId: 'warp',
    carrierName: 'US Mobile Warp',
    name: 'Unlimited Premium',
    basePrice: 44,
    pricePerLine: {
      line1: 44,
      line2: 35,
      line3: 25,
      line4: 20, 
      line5Plus: 18,
    },
    dataAllowance: {
      premium: 100,
      hotspot: 50,
    },
    features: [
      "100GB of prioritized premium data (5G devices)",
      "50GB hotspot data",
      "Automatic data prioritization",
      "Free network transfers (Teleport)",
      "Annual option: $390/year ($32.50/mo)",
      "Optimized speeds during heavy usage"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31)",
      "Free Maestro 3 smartphone with 3-month subscription"
    ],
    streamingQuality: '1080p',
    network: 'Verizon',
    iconName: 'Zap'
  },
  // Lightspeed carrier plans (T-Mobile)
  {
    id: 'lightspeed-premium',
    carrierId: 'lightspeed',
    carrierName: 'US Mobile LightSpeed',
    name: 'Unlimited Premium',
    basePrice: 44,
    pricePerLine: {
      line1: 44,
      line2: 35,
      line3: 25,
      line4: 20, 
      line5Plus: 18,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 50,
    },
    features: [
      "High-speed data (deprioritized during congestion)",
      "50GB hotspot data",
      "Robust urban coverage",
      "Free network transfers (Teleport)",
      "Annual option: $390/year ($32.50/mo)",
      "Unlimited talk, text and data"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31)",
      "Free Maestro 3 smartphone with 3-month subscription"
    ],
    streamingQuality: '1080p',
    network: 'T-Mobile',
    iconName: 'Lightbulb'
  }
];

export function getCarrierPlanPrice(plan: CarrierPlan, numberOfLines: number): number {
  if (numberOfLines <= 0) return 0;
  
  let pricePerLine;
  switch (numberOfLines) {
    case 1: pricePerLine = plan.pricePerLine.line1; break;
    case 2: pricePerLine = plan.pricePerLine.line2; break;
    case 3: pricePerLine = plan.pricePerLine.line3; break;
    case 4: pricePerLine = plan.pricePerLine.line4; break;
    default: pricePerLine = plan.pricePerLine.line5Plus; break;
  }
  
  const basePrice = pricePerLine * numberOfLines;
  
  // Apply discount if one exists
  if (plan.discountType && plan.discountValue) {
    if (plan.discountType === 'percentage') {
      return basePrice * (1 - (plan.discountValue / 100));
    } else if (plan.discountType === 'fixed') {
      return Math.max(0, basePrice - plan.discountValue);
    }
  }
  
  return basePrice;
}

export function formatCarrierPlanPrice(plan: CarrierPlan, numberOfLines: number): string {
  const price = getCarrierPlanPrice(plan, numberOfLines);
  return formatCurrency(price);
}

export function findBestCarrierMatch(verizonPlanName: string, carrierId: string): string {
  // Match Verizon plans to their closest equivalent in the specified carrier
  
  // Filter plans by carrier
  const carrierPlans = alternativeCarrierPlans.filter(plan => plan.carrierId === carrierId);
  
  if (carrierId === 'darkstar') {
    return 'darkstar-premium';
  } else if (carrierId === 'warp') {
    return 'warp-premium';
  } else if (carrierId === 'lightspeed') {
    return 'lightspeed-premium';
  }
  
  // Default to the first plan of the carrier if no match is found
  return carrierPlans.length > 0 ? carrierPlans[0].id : '';
}

// Updated to show only these three US Mobile sub-brands
export const supportedCarriers = [
  { id: 'darkstar', name: 'US Mobile DarkStar', icon: 'Star', isPrimary: false },
  { id: 'warp', name: 'US Mobile Warp', icon: 'Zap', isPrimary: false },
  { id: 'lightspeed', name: 'US Mobile LightSpeed', icon: 'Lightbulb', isPrimary: false }
];

// Helper function to get all US Mobile carriers and sub-brands
export function getUSMobileCarriers() {
  return supportedCarriers;
}
