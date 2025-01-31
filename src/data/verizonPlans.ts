export interface Plan {
  id: string;
  name: string;
  basePrice: number;
  multiLineDiscounts: {
    lines2: number;
    lines3: number;
    lines4: number;
    lines5Plus: number;
  };
  features: string[];
  type: 'consumer' | 'business';
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  expires: string;
  type: 'device' | 'plan' | 'trade-in';
  value: string;
}

export const plans: Plan[] = [
  {
    id: '1',
    name: 'Unlimited Welcome',
    basePrice: 65,
    multiLineDiscounts: {
      lines2: 55,
      lines3: 40,
      lines4: 30,
      lines5Plus: 30
    },
    features: [
      '5G Nationwide',
      'Unlimited talk & text',
      'Unlimited data',
      'DVD-quality streaming (480p)',
      'Mobile hotspot not included'
    ],
    type: 'consumer'
  },
  {
    id: '2',
    name: 'Unlimited Plus',
    basePrice: 80,
    multiLineDiscounts: {
      lines2: 70,
      lines3: 55,
      lines4: 45,
      lines5Plus: 45
    },
    features: [
      '5G Ultra Wideband',
      'Unlimited Premium Data',
      'HD streaming (720p)',
      '30GB premium mobile hotspot',
      'International texting to 200+ countries'
    ],
    type: 'consumer'
  },
  {
    id: '3',
    name: 'Unlimited Ultimate',
    basePrice: 90,
    multiLineDiscounts: {
      lines2: 80,
      lines3: 65,
      lines4: 55,
      lines5Plus: 55
    },
    features: [
      '5G Ultra Wideband',
      'Unlimited Premium Data',
      '4K UHD streaming where available',
      '60GB premium mobile hotspot',
      'International texting to 200+ countries',
      'Global data in 210+ countries'
    ],
    type: 'consumer'
  }
];

export const promotions: Promotion[] = [
  {
    id: '1',
    title: 'New Line Special',
    description: 'Get $500 off when adding a new line with any 5G plan',
    expires: '2024-05-01',
    type: 'plan',
    value: '$500 off'
  },
  {
    id: '2',
    title: 'Trade-In Bonus',
    description: 'Up to $1000 trade-in value for eligible devices',
    expires: '2024-04-15',
    type: 'trade-in',
    value: 'Up to $1000'
  },
  {
    id: '3',
    title: 'Family Plan Discount',
    description: 'Save $25/line when adding 4+ lines',
    expires: '2024-06-30',
    type: 'plan',
    value: '$25/line'
  },
  {
    id: '4',
    title: 'Device Upgrade Special',
    description: 'Get up to $800 off select 5G phones with eligible trade-in',
    expires: '2024-05-15',
    type: 'device',
    value: 'Up to $800'
  }
];
