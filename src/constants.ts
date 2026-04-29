/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material, Monster, Recipe } from './types';

export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
export const CHAIN_ID = '0x7a69'; // 31337

export const BACKGROUND_IMAGE = 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777453423/Gemini_Generated_Image_9ybnf19ybnf19ybn_mlhqrn.png';

export const MATERIALS: Material[] = [
  { id: 'wood', name: 'ไม้', image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777451943/fc202_fwygb1.png', description: 'วัสดุพื้นฐานสำหรับทำด้ามจับ' },
  { id: 'iron', name: 'เหล็ก', image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452282/fc148_htmhaq.png', description: 'เหล็กกล้าแข็งแกร่ง' },
  { id: 'ice_ore', name: 'แร่น้ำแข็ง', image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452357/fc165_ibk1tz.png', description: 'แร่ที่เยือกแข็งตลอดกาล' },
  { id: 'fire_ore', name: 'แร่ไฟ', image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452365/fc163_kepjv9.png', description: 'แร่ที่ร้อนแรงดั่งลาวา' },
  { id: 'lightning_ore', name: 'แร่สายฟ้า', image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452369/fc164_pahpx0.png', description: 'แร่ที่มีประจุไฟฟ้าสถิต' },
  { id: 'herb', name: 'สมุนไพร', image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452391/fc242_yzmgay.png', description: 'ใช้ปรุงยาหรือเสริมพลัง' },
  { id: 'magic_stone', name: 'หินพลังเวท', image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452933/fc2130_wkq2at.png', description: 'หินที่บรรจุพลังงานเวทมนตร์' },
];

export const MONSTERS: Monster[] = [
  {
    id: 'soul_wraith',
    name: 'Soul Wraith',
    description: 'วิญญาณอาฆาตที่เร่ร่อนในความมืด',
    image: 'https://res.cloudinary.com/dkyzhwy4w/image/upload/v1760089759/soul_wraith_alt_jibnvu.png',
    hp: 100, maxHp: 100, damage: 10, speed: 12, xpReward: 50,
    materialRewards: [{ materialId: 'magic_stone', min: 1, max: 2 }, { materialId: 'herb', min: 1, max: 3 }]
  },
  {
    id: 'tormented_ghoul',
    name: 'Tormented Ghoul',
    description: 'ซากศพที่ทุกข์ทรมานและหิวกระหาย',
    image: 'https://res.cloudinary.com/dkyzhwy4w/image/upload/v1760089760/tormented_ghoul_alt_bv0wkn.png',
    hp: 150, maxHp: 150, damage: 15, speed: 8, xpReward: 70,
    materialRewards: [{ materialId: 'wood', min: 2, max: 4 }, { materialId: 'iron', min: 1, max: 2 }]
  },
  {
    id: 'undead_knight',
    name: 'Undead Knight',
    description: 'อัศวินผู้พิทักษ์สุสานที่ไม่มีวันตาย',
    image: 'https://res.cloudinary.com/dkyzhwy4w/image/upload/v1760089760/undead_knight_alt_zfkml3.png',
    hp: 250, maxHp: 250, damage: 25, speed: 6, xpReward: 120,
    materialRewards: [{ materialId: 'iron', min: 3, max: 5 }, { materialId: 'fire_ore', min: 1, max: 2 }]
  },
  {
    id: 'grave_titan',
    name: 'Grave Titan',
    description: 'ยักษ์พฤกษาจากหลุมฝังศพที่มีพละกำลังมหาศาล',
    image: 'https://res.cloudinary.com/dkyzhwy4w/image/upload/v1760089753/grave_titan_alt_fapkid.png',
    hp: 500, maxHp: 500, damage: 20, speed: 4, xpReward: 300,
    materialRewards: [{ materialId: 'magic_stone', min: 3, max: 6 }, { materialId: 'lightning_ore', min: 1, max: 3 }]
  },
  {
    id: 'zombie_mage',
    name: 'Zombie Mage',
    description: 'จอมเวทผู้ใช้ศาสตร์มืดและคำสาป',
    image: 'https://res.cloudinary.com/dkyzhwy4w/image/upload/v1760089767/zombie_mage_alt_qcejvr.png',
    hp: 180, maxHp: 180, damage: 35, speed: 10, xpReward: 150,
    materialRewards: [{ materialId: 'ice_ore', min: 2, max: 4 }, { materialId: 'magic_stone', min: 2, max: 4 }]
  },
];

export const RECIPES: Recipe[] = [
  {
    id: 'sword',
    name: 'ดาบ',
    description: 'ดาบเหล็กมาตรฐาน สมดุลในทุกด้าน',
    image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777451967/fc1777_vi74w8.png',
    materials: [{ materialId: 'iron', count: 3 }, { materialId: 'wood', count: 1 }],
    baseDamage: 20, baseSpeed: 10, baseHpBonus: 50, rarity: 'Common'
  },
  {
    id: 'greatsword',
    name: 'ดาบใหญ่',
    description: 'ดาบขนาดใหญ่ที่เน้นพลังโจมตีรุนแรง',
    image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452316/fc1616_f3vz8g.png',
    materials: [{ materialId: 'iron', count: 5 }, { materialId: 'wood', count: 2 }],
    baseDamage: 45, baseSpeed: 5, baseHpBonus: 150, rarity: 'Rare'
  },
  {
    id: 'ice_sword',
    name: 'ดาบน้ำแข็ง',
    description: 'คมดาบที่เคลือบด้วยไอเย็นนิรันดร์',
    image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452233/fc1022_g8evtm.png',
    materials: [{ materialId: 'iron', count: 3 }, { materialId: 'ice_ore', count: 2 }, { materialId: 'magic_stone', count: 1 }],
    baseDamage: 55, baseSpeed: 9, baseHpBonus: 300, rarity: 'Epic'
  },
  {
    id: 'fire_sword',
    name: 'ดาบไฟ',
    description: 'ดาบที่ลุกโชนด้วยเปลวเพลิงที่ไม่มีวันมอด',
    image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452240/fc1006_kwpjxc.png',
    materials: [{ materialId: 'iron', count: 3 }, { materialId: 'fire_ore', count: 2 }, { materialId: 'magic_stone', count: 1 }],
    baseDamage: 60, baseSpeed: 10, baseHpBonus: 300, rarity: 'Epic'
  },
  {
    id: 'lightning_sword',
    name: 'ดาบสายฟ้า',
    description: 'ดาบที่รวดเร็วดั่งสายฟ้าฟาด',
    image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452256/fc1038_wqp22f.png',
    materials: [{ materialId: 'iron', count: 2 }, { materialId: 'lightning_ore', count: 3 }, { materialId: 'magic_stone', count: 1 }],
    baseDamage: 75, baseSpeed: 15, baseHpBonus: 300, rarity: 'Epic'
  },
  {
    id: 'giant_axe',
    name: 'ขวานยักษ์',
    description: 'ขวานที่สามารถทำลายล้างทุกสิ่ง',
    image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452332/fc1685_tgjvh9.png',
    materials: [{ materialId: 'iron', count: 6 }, { materialId: 'wood', count: 3 }],
    baseDamage: 60, baseSpeed: 3, baseHpBonus: 80, rarity: 'Rare'
  },
  {
    id: 'magic_staff',
    name: 'คฑาเวท',
    description: 'คฑาที่รวมศูนย์พลังเวทมนตร์มหาศาล',
    image: 'https://res.cloudinary.com/da8rxgszc/image/upload/v1777452847/fc1498_ukgi4d.png',
    materials: [{ materialId: 'wood', count: 2 }, { materialId: 'magic_stone', count: 5 }, { materialId: 'herb', count: 3 }],
    baseDamage: 105, baseSpeed: 8, baseHpBonus: 60, rarity: 'Legendary'
  },
];
