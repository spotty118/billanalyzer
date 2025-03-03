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
  streamingQuality: '480p' | '720p' | '1080p' | '4K';
  network: 'Verizon' | 'T-Mobile' | 'Both' | 'AT&T' | 'Proprietary';
  iconName: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

// Alternative Carrier plans
export const alternativeCarrierPlans: CarrierPlan[] = [
  // DarkStar carrier plans (now under US Mobile)
  {
    id: 'darkstar-galactic',
    carrierId: 'darkstar',
    carrierName: 'US Mobile DarkStar',
    name: 'Galactic Unlimited',
    basePrice: 50,
    pricePerLine: {
      line1: 50,
      line2: 35,
      line3: 25,
      line4: 20, 
      line5Plus: 18,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 75,
    },
    features: [
      "Unlimited priority data",
      "Global roaming in 150+ countries",
      "200GB cloud storage",
      "75GB hotspot data",
      "Priority network access",
      "Unlimited talk and text worldwide"
    ],
    streamingPerks: [
      "Netflix Premium",
      "Disney+ Bundle",
      "Apple Music",
      "Amazon Prime",
      "All streaming perks with 2+ lines"
    ],
    streamingQuality: '4K',
    network: 'AT&T',
    iconName: 'Star',
    discountType: 'percentage',
    discountValue: 15
  },
  // Warp carrier plans (now under US Mobile)
  {
    id: 'warp-hyperdrive',
    carrierId: 'warp',
    carrierName: 'US Mobile Warp',
    name: 'Hyperdrive Plus',
    basePrice: 40,
    pricePerLine: {
      line1: 40,
      line2: 30,
      line3: 20,
      line4: 15, 
      line5Plus: 15,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 40,
    },
    features: [
      "Unlimited high-speed data",
      "Regional roaming",
      "50GB cloud storage",
      "40GB hotspot data",
      "Enhanced 5G coverage",
      "Unlimited talk and text"
    ],
    streamingPerks: [
      "Hulu",
      "Spotify",
      "Choose 2 perks with any plan"
    ],
    streamingQuality: '1080p',
    network: 'Verizon',
    iconName: 'Zap'
  },
  // Lightspeed carrier plans (now under US Mobile)
  {
    id: 'lightspeed-photon',
    carrierId: 'lightspeed',
    carrierName: 'US Mobile LightSpeed',
    name: 'Photon Unlimited',
    basePrice: 55,
    pricePerLine: {
      line1: 55,
      line2: 40,
      line3: 30,
      line4: 25, 
      line5Plus: 22,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 100,
    },
    features: [
      "Unlimited premium data",
      "Worldwide roaming",
      "500GB cloud storage",
      "100GB hotspot data",
      "Ultra-fast 5G+ access",
      "Unlimited talk, text and data globally"
    ],
    streamingPerks: [
      "HBO Max",
      "YouTube Premium",
      "Peacock Premium",
      "Apple TV+",
      "All streaming perks included"
    ],
    streamingQuality: '4K',
    network: 'T-Mobile',
    iconName: 'Lightbulb',
    discountType: 'fixed',
    discountValue: 8
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
  const planName = verizonPlanName.toLowerCase();
  
  // Filter plans by carrier
  const carrierPlans = alternativeCarrierPlans.filter(plan => plan.carrierId === carrierId);
  
  if (carrierId === 'darkstar') {
    return 'darkstar-galactic';
  } else if (carrierId === 'warp') {
    return 'warp-hyperdrive';
  } else if (carrierId === 'lightspeed') {
    return 'lightspeed-photon';
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
