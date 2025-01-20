export interface Plan {
  id: string;
  name: string;
  price: number;
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
    price: 65,
    features: [
      '5G Nationwide',
      'Unlimited talk & text',
      'Unlimited data',
      'DVD-quality streaming'
    ],
    type: 'consumer'
  },
  {
    id: '2',
    name: 'Unlimited Plus',
    price: 75,
    features: [
      '5G Ultra Wideband',
      'Unlimited Premium Data',
      'HD streaming',
      '25GB mobile hotspot'
    ],
    type: 'consumer'
  },
  {
    id: '3',
    name: 'Unlimited Ultimate',
    price: 85,
    features: [
      '5G Ultra Wideband',
      'Unlimited Premium Data',
      '4K UHD streaming',
      '50GB mobile hotspot'
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