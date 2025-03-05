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
    hotspot?: number | 'unlimited';
  };
  features: string[];
  streamingPerks: string[];
  streamingQuality: '480p' | '720p' | '1080p' | '4K' | 'QHD';
  network: 'Verizon' | 'T-Mobile' | 'Both' | 'AT&T' | 'Proprietary';
  iconName: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  dataPriorityLevel?: string;
  annualPrice?: number;
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
      line2: 44,
      line3: 44,
      line4: 44, 
      line5Plus: 44,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: "100GB high-speed, 100GB 8Mbps, then 600Kbps" as any as 'unlimited',
    },
    features: [
      "Nationwide 5G coverage",
      "Truly unlimited, never-throttled premium data (QCI-8)",
      "Extensive hotspot data allocation",
      "20GB international roaming (90+ countries)",
      "Free network transfers (Teleport)",
      "Annual option: $390/year ($32.50/mo)",
      "Priority network access"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "Free international texts from US"
    ],
    streamingQuality: 'QHD',
    network: 'AT&T',
    iconName: 'Star',
    dataPriorityLevel: 'QCI 8',
    annualPrice: 390
  },
  {
    id: 'darkstar-starter',
    carrierId: 'darkstar',
    carrierName: 'US Mobile DarkStar',
    name: 'Unlimited Starter',
    basePrice: 25,
    pricePerLine: {
      line1: 25,
      line2: 25,
      line3: 25,
      line4: 25, 
      line5Plus: 25,
    },
    dataAllowance: {
      premium: 35,
      hotspot: 10,
    },
    features: [
      "Nationwide 5G coverage",
      "35GB of high-speed data",
      "10GB hotspot data",
      "QCI 9 included / QCI 8: $12/mo add-on",
      "Annual option: $270/year ($22.50/mo)",
      "Free international texts from US"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "1GB international data on annual plan"
    ],
    streamingQuality: '1080p',
    network: 'AT&T',
    iconName: 'Star',
    dataPriorityLevel: 'QCI 9 included / QCI 8: $12 mo / $120 annual add-on',
    annualPrice: 270
  },
  {
    id: 'darkstar-flex',
    carrierId: 'darkstar',
    carrierName: 'US Mobile DarkStar',
    name: 'Unlimited Flex',
    basePrice: 17.5,
    pricePerLine: {
      line1: 17.5,
      line2: 17.5,
      line3: 17.5,
      line4: 17.5, 
      line5Plus: 17.5,
    },
    dataAllowance: {
      premium: 10,
      hotspot: 5,
    },
    features: [
      "Nationwide 5G coverage",
      "10GB of high-speed data",
      "5GB hotspot data",
      "QCI 9 included / QCI 8: $12/mo add-on",
      "Annual only: $210/year ($17.50/mo)",
      "Free international texts from US"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "International calling from US included on annual plan"
    ],
    streamingQuality: '1080p',
    network: 'AT&T',
    iconName: 'Star',
    dataPriorityLevel: 'QCI 9 included / QCI 8: $12 mo / $120 annual add-on',
    annualPrice: 210
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
      line2: 44,
      line3: 44,
      line4: 44, 
      line5Plus: 44,
    },
    dataAllowance: {
      premium: 100,
      hotspot: 50,
    },
    features: [
      "Warp mmWave & C-band",
      "100GB of premium data",
      "50GB hotspot data",
      "QCI 8 on 5G devices",
      "Free network transfers (Teleport)",
      "Annual option: $390/year ($32.50/mo)",
      "Free Apple Watch Plan"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "10GB international data"
    ],
    streamingQuality: '1080p',
    network: 'Verizon',
    iconName: 'Zap',
    dataPriorityLevel: 'QCI 8 on 5G devices',
    annualPrice: 390
  },
  {
    id: 'warp-starter',
    carrierId: 'warp',
    carrierName: 'US Mobile Warp',
    name: 'Unlimited Starter',
    basePrice: 25,
    pricePerLine: {
      line1: 25,
      line2: 25,
      line3: 25,
      line4: 25, 
      line5Plus: 25,
    },
    dataAllowance: {
      premium: 35,
      hotspot: 10,
    },
    features: [
      "Warp mmWave & C-band",
      "35GB of premium data",
      "10GB hotspot data",
      "QCI 8 on 5G devices",
      "Annual option: $270/year ($22.50/mo)",
      "Apple Watch Plan available for purchase"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "1GB international data on annual plan"
    ],
    streamingQuality: '1080p',
    network: 'Verizon',
    iconName: 'Zap',
    dataPriorityLevel: 'QCI 8 on 5G devices',
    annualPrice: 270
  },
  {
    id: 'warp-flex',
    carrierId: 'warp',
    carrierName: 'US Mobile Warp',
    name: 'Unlimited Flex',
    basePrice: 17.5,
    pricePerLine: {
      line1: 17.5,
      line2: 17.5,
      line3: 17.5,
      line4: 17.5, 
      line5Plus: 17.5,
    },
    dataAllowance: {
      premium: 10,
      hotspot: 5,
    },
    features: [
      "Warp mmWave & C-band",
      "10GB of premium data",
      "5GB hotspot data",
      "QCI 8 on 5G devices",
      "Annual only: $210/year ($17.50/mo)",
      "Apple Watch Plan available for purchase"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "International calling from US included on annual plan"
    ],
    streamingQuality: '1080p',
    network: 'Verizon',
    iconName: 'Zap',
    dataPriorityLevel: 'QCI 8 on 5G devices',
    annualPrice: 210
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
      line2: 44,
      line3: 44,
      line4: 44, 
      line5Plus: 44,
    },
    dataAllowance: {
      premium: 100,
      hotspot: 50,
    },
    features: [
      "Nationwide 5G coverage",
      "100GB of high-speed data",
      "50GB hotspot data",
      "QCI 7 data priority level",
      "Free network transfers (Teleport)",
      "Annual option: $390/year ($32.50/mo)",
      "Apple Watch support coming soon"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "10GB international data"
    ],
    streamingQuality: '1080p',
    network: 'T-Mobile',
    iconName: 'Lightbulb',
    dataPriorityLevel: 'QCI 7',
    annualPrice: 390
  },
  {
    id: 'lightspeed-starter',
    carrierId: 'lightspeed',
    carrierName: 'US Mobile LightSpeed',
    name: 'Unlimited Starter',
    basePrice: 25,
    pricePerLine: {
      line1: 25,
      line2: 25,
      line3: 25,
      line4: 25, 
      line5Plus: 25,
    },
    dataAllowance: {
      premium: 35,
      hotspot: 10,
    },
    features: [
      "Nationwide 5G coverage",
      "35GB of high-speed data",
      "10GB hotspot data",
      "QCI 7 data priority level",
      "Annual option: $270/year ($22.50/mo)",
      "Apple Watch support coming soon"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "1GB international data on annual plan"
    ],
    streamingQuality: '1080p',
    network: 'T-Mobile',
    iconName: 'Lightbulb',
    dataPriorityLevel: 'QCI 7',
    annualPrice: 270
  },
  {
    id: 'lightspeed-flex',
    carrierId: 'lightspeed',
    carrierName: 'US Mobile LightSpeed',
    name: 'Unlimited Flex',
    basePrice: 17.5,
    pricePerLine: {
      line1: 17.5,
      line2: 17.5,
      line3: 17.5,
      line4: 17.5, 
      line5Plus: 17.5,
    },
    dataAllowance: {
      premium: 10,
      hotspot: 5,
    },
    features: [
      "Nationwide 5G coverage",
      "10GB of high-speed data",
      "5GB hotspot data",
      "QCI 7 data priority level",
      "Annual only: $210/year ($17.50/mo)",
      "Apple Watch support coming soon"
    ],
    streamingPerks: [
      "Multi-network add-on (free until March 31, 2025)",
      "International calling from US included on annual plan"
    ],
    streamingQuality: '1080p',
    network: 'T-Mobile',
    iconName: 'Lightbulb',
    dataPriorityLevel: 'QCI 7',
    annualPrice: 210
  },
  
  // Visible Carrier Plans (Verizon)
  {
    id: 'visible-basic',
    carrierId: 'visible',
    carrierName: 'Visible',
    name: 'Visible Basic',
    basePrice: 25,
    pricePerLine: {
      line1: 25,
      line2: 25,
      line3: 25,
      line4: 25,
      line5Plus: 25,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 5,
    },
    features: [
      "Unlimited data, talk & text",
      "5GB mobile hotspot",
      "No contract",
      "Taxes & fees included",
      "Verizon network",
      "Deprioritized data (QCI 9)",
      "eSIM/physical SIM support"
    ],
    streamingPerks: [
      "480p video streaming"
    ],
    streamingQuality: '480p',
    network: 'Verizon',
    iconName: 'Eye',
    dataPriorityLevel: 'QCI 9',
  },
  {
    id: 'visible-plus',
    carrierId: 'visible',
    carrierName: 'Visible',
    name: 'Visible+',
    basePrice: 45,
    pricePerLine: {
      line1: 45,
      line2: 45,
      line3: 45,
      line4: 45,
      line5Plus: 45,
    },
    dataAllowance: {
      premium: 50,
      hotspot: 'unlimited',
    },
    features: [
      "50GB premium data (QCI 8)",
      "Unlimited mobile hotspot (5 Mbps)",
      "No contract",
      "Taxes & fees included",
      "Verizon 5G Ultra Wideband access",
      "International calling to 30+ countries",
      "Roaming in Canada & Mexico"
    ],
    streamingPerks: [
      "Full HD streaming (1080p)",
      "Global calling from US to 30+ countries"
    ],
    streamingQuality: '1080p',
    network: 'Verizon',
    iconName: 'Eye',
    dataPriorityLevel: 'QCI 8 (50GB), then QCI 9',
  },
  
  // Cricket Wireless Plans (AT&T)
  {
    id: 'cricket-basic',
    carrierId: 'cricket',
    carrierName: 'Cricket Wireless',
    name: 'Basic Plan',
    basePrice: 30,
    pricePerLine: {
      line1: 30,
      line2: 30,
      line3: 30,
      line4: 30,
      line5Plus: 30,
    },
    dataAllowance: {
      premium: 5,
      hotspot: 0,
    },
    features: [
      "5GB data, then slowed",
      "Unlimited talk & text",
      "SD video streaming",
      "Compatible with most AT&T devices"
    ],
    streamingPerks: [],
    streamingQuality: '480p',
    network: 'AT&T',
    iconName: 'CircleDot',
    dataPriorityLevel: 'QCI 9',
  },
  {
    id: 'cricket-unlimited',
    carrierId: 'cricket',
    carrierName: 'Cricket Wireless',
    name: 'Unlimited Plan',
    basePrice: 55,
    pricePerLine: {
      line1: 55,
      line2: 55,
      line3: 55,
      line4: 55,
      line5Plus: 55,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 15,
    },
    features: [
      "Unlimited data (speeds max at 8Mbps)",
      "15GB hotspot included",
      "Unlimited talk & text to/from Mexico and Canada",
      "HBO Max with Ads included"
    ],
    streamingPerks: [
      "HBO Max with Ads"
    ],
    streamingQuality: '480p',
    network: 'AT&T',
    iconName: 'CircleDot',
    dataPriorityLevel: 'QCI 9',
  },
  
  // Straight Talk Plans (Verizon/AT&T/T-Mobile)
  {
    id: 'straighttalk-unlimited',
    carrierId: 'straighttalk',
    carrierName: 'Straight Talk',
    name: 'Unlimited Plan',
    basePrice: 45,
    pricePerLine: {
      line1: 45,
      line2: 45,
      line3: 45,
      line4: 45,
      line5Plus: 45,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 10,
    },
    features: [
      "Unlimited talk, text & data",
      "First 10GB at high speeds, then reduced",
      "10GB hotspot included",
      "Multi-network compatibility (choose your SIM)"
    ],
    streamingPerks: [],
    streamingQuality: '480p',
    network: 'Both',
    iconName: 'Smartphone',
    dataPriorityLevel: 'QCI 9',
  },
  {
    id: 'straighttalk-unlimited-plus',
    carrierId: 'straighttalk',
    carrierName: 'Straight Talk',
    name: 'Unlimited Plus',
    basePrice: 60,
    pricePerLine: {
      line1: 60,
      line2: 60,
      line3: 60,
      line4: 60,
      line5Plus: 60,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 25,
    },
    features: [
      "Unlimited talk, text & high-speed data",
      "25GB hotspot data",
      "International calling to select countries",
      "Multi-network compatibility"
    ],
    streamingPerks: [],
    streamingQuality: '720p',
    network: 'Both',
    iconName: 'Smartphone',
    dataPriorityLevel: 'QCI 9',
  },
  
  // Total Wireless Plans (Verizon)
  {
    id: 'total-single',
    carrierId: 'total',
    carrierName: 'Total Wireless',
    name: 'Single Line Plan',
    basePrice: 35,
    pricePerLine: {
      line1: 35,
      line2: 35,
      line3: 35,
      line4: 35,
      line5Plus: 35,
    },
    dataAllowance: {
      premium: 10,
      hotspot: 0,
    },
    features: [
      "10GB of high-speed data, then 2G",
      "Unlimited talk & text",
      "Uses Verizon's nationwide network",
      "No contracts"
    ],
    streamingPerks: [],
    streamingQuality: '480p',
    network: 'Verizon',
    iconName: 'SquareGantt',
    dataPriorityLevel: 'QCI 9',
  },
  {
    id: 'total-unlimited',
    carrierId: 'total',
    carrierName: 'Total Wireless',
    name: 'Unlimited Plan',
    basePrice: 50,
    pricePerLine: {
      line1: 50,
      line2: 50,
      line3: 50,
      line4: 50,
      line5Plus: 50,
    },
    dataAllowance: {
      premium: 'unlimited',
      hotspot: 10,
    },
    features: [
      "Unlimited data (may be slowed during congestion)",
      "10GB hotspot data included",
      "Unlimited talk & text to/from Mexico, Canada & more",
      "Verizon network coverage"
    ],
    streamingPerks: [],
    streamingQuality: '480p',
    network: 'Verizon',
    iconName: 'SquareGantt',
    dataPriorityLevel: 'QCI 9',
  }
];

export function getCarrierPlanPrice(plan: CarrierPlan, numberOfLines: number): number {
  if (numberOfLines <= 0) return 0;
  
  // For US Mobile and Visible plans, simply multiply the base price by the number of lines
  // as they don't offer multi-line discounts
  return plan.basePrice * numberOfLines;
}

export function formatCarrierPlanPrice(plan: CarrierPlan, numberOfLines: number): string {
  const price = getCarrierPlanPrice(plan, numberOfLines);
  return formatCurrency(price);
}

export function findBestCarrierMatch(carrierId: string): string {
  // Match carrier ID to their closest equivalent carrier plan
  if (carrierId === 'darkstar') {
    return 'darkstar-premium';
  } else if (carrierId === 'warp') {
    return 'warp-premium';
  } else if (carrierId === 'lightspeed') {
    return 'lightspeed-premium';
  } else if (carrierId === 'visible') {
    return 'visible-plus';
  } else if (carrierId === 'cricket') {
    return 'cricket-unlimited';
  } else if (carrierId === 'straighttalk') {
    return 'straighttalk-unlimited-plus';
  } else if (carrierId === 'total') {
    return 'total-unlimited';
  }
  
  // Default to the first plan of the carrier if no match is found
  const carrierPlans = alternativeCarrierPlans.filter(plan => plan.carrierId === carrierId);
  return carrierPlans.length > 0 ? carrierPlans[0].id : '';
}

// Updated to include more prepaid carriers
export const supportedCarriers = [
  { id: 'darkstar', name: 'US Mobile DarkStar', icon: 'Star', isPrimary: false },
  { id: 'warp', name: 'US Mobile Warp', icon: 'Zap', isPrimary: false },
  { id: 'lightspeed', name: 'US Mobile LightSpeed', icon: 'Lightbulb', isPrimary: false },
  { id: 'visible', name: 'Visible', icon: 'Eye', isPrimary: false },
  { id: 'cricket', name: 'Cricket Wireless', icon: 'CircleDot', isPrimary: false },
  { id: 'straighttalk', name: 'Straight Talk', icon: 'Smartphone', isPrimary: false },
  { id: 'total', name: 'Total Wireless', icon: 'SquareGantt', isPrimary: false }
];

// Helper function to get all US Mobile carriers and sub-brands
export function getUSMobileCarriers() {
  return supportedCarriers.filter(carrier => 
    ['darkstar', 'warp', 'lightspeed'].includes(carrier.id)
  );
}

// Helper function to get all Visible carriers
export function getVisibleCarriers() {
  return supportedCarriers.filter(carrier => carrier.id === 'visible');
}

// Helper function to get all third-party prepaid carriers
export function getThirdPartyCarriers() {
  return supportedCarriers.filter(carrier => 
    ['cricket', 'straighttalk', 'total'].includes(carrier.id)
  );
}
