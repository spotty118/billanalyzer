
export interface Device {
  id: string;
  name: string;
  baseCommission: number;
  category: 'phone' | 'tablet' | 'watch' | 'accessory';
}

export interface Addon {
  id: string;
  name: string;
  commission: number;
  category: 'protection' | 'service' | 'feature';
}

export const devices: Device[] = [
  {
    id: "iphone-15",
    name: "iPhone 15",
    baseCommission: 50,
    category: "phone"
  },
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    baseCommission: 75,
    category: "phone"
  },
  {
    id: "s24",
    name: "Samsung Galaxy S24",
    baseCommission: 50,
    category: "phone"
  },
  {
    id: "s24-ultra",
    name: "Samsung Galaxy S24 Ultra",
    baseCommission: 75,
    category: "phone"
  },
  {
    id: "pixel-8",
    name: "Google Pixel 8",
    baseCommission: 50,
    category: "phone"
  },
  {
    id: "ipad",
    name: "iPad",
    baseCommission: 40,
    category: "tablet"
  },
  {
    id: "tab-s9",
    name: "Samsung Galaxy Tab S9",
    baseCommission: 40,
    category: "tablet"
  },
  {
    id: "watch-9",
    name: "Apple Watch Series 9",
    baseCommission: 30,
    category: "watch"
  },
  {
    id: "watch-6",
    name: "Samsung Galaxy Watch 6",
    baseCommission: 30,
    category: "watch"
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
