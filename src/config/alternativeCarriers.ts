
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
}

// Alternative Carrier plans
export const alternativeCarrierPlans: CarrierPlan[] = [
  // US Mobile plans
  {
    id: 'usmobile-premium-unlimited',
    carrierId: 'usmobile',
    carrierName: 'US Mobile',
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
    network: 'Verizon',
    iconName: 'ArrowLeftRight'
  },
  {
    id: 'usmobile-unlimited-basic',
    carrierId: 'usmobile',
    carrierName: 'US Mobile',
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
    network: 'Verizon',
    iconName: 'ArrowLeftRight'
  },
  // Darkstar carrier plans
  {
    id: 'darkstar-galactic',
    carrierId: 'darkstar',
    carrierName: 'DarkStar',
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
    network: 'Both',
    iconName: 'Star'
  },
  // Warp carrier plans
  {
    id: 'warp-hyperdrive',
    carrierId: 'warp',
    carrierName: 'Warp',
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
    network: 'T-Mobile',
    iconName: 'Zap'
  },
  // Lightspeed carrier plans
  {
    id: 'lightspeed-photon',
    carrierId: 'lightspeed',
    carrierName: 'LightSpeed',
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
    network: 'AT&T',
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
  
  return pricePerLine * numberOfLines;
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
  
  if (carrierId === 'usmobile') {
    if (planName.includes('ultimate')) {
      return 'usmobile-premium-unlimited';
    } else {
      return 'usmobile-unlimited-basic';
    }
  } else if (carrierId === 'darkstar') {
    return 'darkstar-galactic';
  } else if (carrierId === 'warp') {
    return 'warp-hyperdrive';
  } else if (carrierId === 'lightspeed') {
    return 'lightspeed-photon';
  }
  
  // Default to the first plan of the carrier if no match is found
  return carrierPlans.length > 0 ? carrierPlans[0].id : '';
}

export const supportedCarriers = [
  { id: 'usmobile', name: 'US Mobile', icon: 'ArrowLeftRight' },
  { id: 'darkstar', name: 'DarkStar', icon: 'Star' },
  { id: 'warp', name: 'Warp', icon: 'Zap' },
  { id: 'lightspeed', name: 'LightSpeed', icon: 'Lightbulb' }
];
