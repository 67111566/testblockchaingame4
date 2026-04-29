/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Weapon {
  tokenId?: number;
  itemName: string;
  description: string;
  image: string;
  isUsed: boolean;
  owner: string;
  // Stats added for game logic
  damage: number;
  speed: number;
  hpBonus: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  image: string;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  xpReward: number;
  materialRewards: { materialId: string; min: number; max: number }[];
}

export interface Material {
  id: string;
  name: string;
  image: string;
  description: string;
}

export interface InventoryItem {
  materialId: string;
  count: number;
}

export interface GameState {
  materials: { [id: string]: number };
  monsterCards: string[]; // IDs of monsters defeated
  equippedWeaponId: number | null;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  image: string;
  materials: { materialId: string; count: number }[];
  baseDamage: number;
  baseSpeed: number;
  baseHpBonus: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}
