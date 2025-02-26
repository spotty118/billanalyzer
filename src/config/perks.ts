import { PerkType } from '@/types';

export interface PerkDefinition {
  id: PerkType;
  label: string;
  category: 'entertainment' | 'service' | 'other';
  price: number;
}

export const PERKS: PerkDefinition[] = [
  { id: 'apple_music', label: 'Apple Music', category: 'entertainment', price: 10 },
  { id: 'apple_one', label: 'Apple One', category: 'entertainment', price: 10 },
  { id: 'disney', label: 'Disney Bundle', category: 'entertainment', price: 10 },
  { id: 'google', label: 'Google One', category: 'service', price: 10 },
  { id: 'netflix', label: 'Netflix & Max (with Ads)', category: 'entertainment', price: 10 },
  { id: 'cloud', label: 'Cloud', category: 'service', price: 10 },
  { id: 'youtube', label: 'YouTube', category: 'entertainment', price: 10 },
  { id: 'hotspot', label: 'Hotspot', category: 'service', price: 10 },
  { id: 'travelpass', label: 'TravelPass', category: 'service', price: 10 }
];

export const getPerkById = (id: string): PerkDefinition | undefined => {
  return PERKS.find(perk => perk.id === id);
};
