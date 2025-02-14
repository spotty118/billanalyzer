
export interface Device {
  id: string;
  name: string;
  baseCommission: number;
  category: 'phone' | 'tablet' | 'watch' | 'accessory';
  brand: 'Apple' | 'Google' | 'Samsung';
  dppPrice?: number;
  spiffAmount: number;
  welcomeUpgrade: number;
  unlimitedPlusUpgrade: number;
  welcomeNew: number;
  unlimitedPlusNew: number;
}

export interface Addon {
  id: string;
  name: string;
  commission: number;
  category: 'protection' | 'service' | 'feature';
}

export const devices: Device[] = [
  // Apple Devices
  {
    id: "iphone-15-128",
    name: "iPhone 15 128GB",
    baseCommission: 50,
    category: "phone",
    brand: "Apple",
    dppPrice: 840.00,
    spiffAmount: 15.00,
    welcomeUpgrade: 15.00,
    unlimitedPlusUpgrade: 35.00,
    welcomeNew: 35.00,
    unlimitedPlusNew: 75.00
  },
  {
    id: "iphone-15-256",
    name: "iPhone 15 256GB",
    baseCommission: 50,
    category: "phone",
    brand: "Apple",
    dppPrice: 940.00,
    spiffAmount: 15.00,
    welcomeUpgrade: 15.00,
    unlimitedPlusUpgrade: 35.00,
    welcomeNew: 35.00,
    unlimitedPlusNew: 75.00
  },
  {
    id: "pixel-8-128",
    name: "Google Pixel 8 128GB",
    baseCommission: 50,
    category: "phone",
    brand: "Google",
    dppPrice: 806.00,
    spiffAmount: 0,
    welcomeUpgrade: 45.00,
    unlimitedPlusUpgrade: 65.00,
    welcomeNew: 100.00,
    unlimitedPlusNew: 140.00
  },
  {
    id: "s24-128",
    name: "Samsung Galaxy S24 128GB",
    baseCommission: 50,
    category: "phone",
    brand: "Samsung",
    dppPrice: 817.00,
    spiffAmount: 0,
    welcomeUpgrade: 45.00,
    unlimitedPlusUpgrade: 65.00,
    welcomeNew: 100.00,
    unlimitedPlusNew: 140.00
  }
];

export const addons: Addon[] = [
  {
    id: "protection-complete",
    name: "Total Mobile Protection",
    commission: 20,
    category: "protection"
  },
  {
    id: "protection-basic",
    name: "Wireless Phone Protection",
    commission: 15,
    category: "protection"
  },
  {
    id: "home-internet",
    name: "Home Internet",
    commission: 50,
    category: "service"
  },
  {
    id: "hotspot",
    name: "Mobile Hotspot",
    commission: 10,
    category: "feature"
  },
  {
    id: "international",
    name: "International Plan",
    commission: 15,
    category: "feature"
  }
];
