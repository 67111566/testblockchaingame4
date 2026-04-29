/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, LayoutGrid, Hammer, Ghost, BookOpen, Wallet, ChevronRight, AlertCircle, CheckCircle2, Shield, Zap, X } from 'lucide-react';
import { Weapon, Monster, Material, GameState, Recipe } from './types';
import { MONSTERS, MATERIALS, RECIPES, BACKGROUND_IMAGE } from './constants';
import { connectWallet, fetchMyWeapons, mintWeaponOnChain } from './lib/ethereum';

export default function App() {
  const [activeTab, setActiveTab] = useState<'battle' | 'craft' | 'inventory' | 'bestiary'>('inventory');
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('etherquest_state');
    if (saved) return JSON.parse(saved);
    return {
      materials: {
        wood: 10,
        iron: 10,
        magic_stone: 2
      },
      monsterCards: [],
      equippedWeaponId: null
    };
  });

  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleState, setBattleState] = useState<'idle' | 'fighting' | 'won' | 'lost'>('idle');
  const [playerHp, setPlayerHp] = useState(120);
  const [playerMaxHp, setPlayerMaxHp] = useState(120);
  const [monsterHp, setMonsterHp] = useState(0);

  useEffect(() => {
    localStorage.setItem('etherquest_state', JSON.stringify(gameState));
  }, [gameState]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const { signer: s, address: addr } = await connectWallet();
      setSigner(s);
      setAddress(addr);
      const wps = await fetchMyWeapons(s);
      setWeapons(wps);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const refreshWeapons = async () => {
    if (signer) {
      const wps = await fetchMyWeapons(signer);
      setWeapons(wps);
    }
  };

  const equipWeapon = (id: number) => {
    setGameState(prev => ({ ...prev, equippedWeaponId: id }));
  };

  const getEquippedWeapon = () => {
    if (gameState.equippedWeaponId === null) return null;
    return weapons.find(w => w.tokenId === gameState.equippedWeaponId);
  };

  const startBattle = (monster: Monster) => {
    const equipped = getEquippedWeapon();
    if (!equipped) {
      setError("โปรดเลือกอาวุธจาก Inventory ก่อนสู้!");
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    const totalMaxHp = 120 + (equipped.hpBonus || 0);

    setSelectedMonster(monster);
    setMonsterHp(monster.hp);
    setPlayerMaxHp(totalMaxHp);
    setPlayerHp(totalMaxHp);
    setBattleLog(["เริ่มการต่อสู้กับ " + monster.name + "!"]);
    setBattleState('fighting');
    setActiveTab('battle');
  };

  const runAutoBattle = () => {
    if (battleState !== 'fighting' || !selectedMonster) return;

    const equipped = getEquippedWeapon();
    if (!equipped) return;

    const playerSpeed = equipped.speed;
    const monsterSpeed = selectedMonster.speed;

    const timer = setInterval(() => {
      setMonsterHp(prevMh => {
        const nextMh = prevMh - equipped.damage;
        setBattleLog(prev => [...prev.slice(-4), `คุณโจมตี ${selectedMonster.name} สร้างความเสียหาย ${equipped.damage}`]);
        
        if (nextMh <= 0) {
          clearInterval(timer);
          setBattleState('won');
          handleWin(selectedMonster);
          return 0;
        }

        // Monster Counter-attacks
        setPlayerHp(prevPh => {
          const nextPh = prevPh - selectedMonster.damage;
          setBattleLog(prev => [...prev.slice(-4), `${selectedMonster.name} โจมตีกลับ สร้างความเสียหาย ${selectedMonster.damage}`]);
          
          if (nextPh <= 0) {
            clearInterval(timer);
            setBattleState('lost');
            return 0;
          }
          return nextPh;
        });

        return nextMh;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  useEffect(() => {
    if (battleState === 'fighting') {
      const cleanup = runAutoBattle();
      return cleanup;
    }
  }, [battleState]);

  const handleWin = (monster: Monster) => {
    const rewards: { [id: string]: number } = {};
    monster.materialRewards.forEach(r => {
      const amt = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
      rewards[r.materialId] = amt;
    });

    setGameState(prev => {
      const newMaterials = { ...prev.materials };
      Object.entries(rewards).forEach(([id, amt]) => {
        newMaterials[id] = (newMaterials[id] || 0) + amt;
      });
      
      const newCards = prev.monsterCards.includes(monster.id) 
        ? prev.monsterCards 
        : [...prev.monsterCards, monster.id];

      return {
        ...prev,
        materials: newMaterials,
        monsterCards: newCards
      };
    });

    setBattleLog(prev => [...prev, "คุณชนะ! ได้รับวัสดุและ Monster Card!"]);
  };

  const handleCraft = async (recipe: Recipe) => {
    if (!signer) {
      setError("กรุณาเชื่อมต่อ Wallet ก่อน!");
      return;
    }

    // Check materials
    const hasMaterials = recipe.materials.every(m => (gameState.materials[m.materialId] || 0) >= m.count);
    if (!hasMaterials) {
      setError("วัสดุไม่เพียงพอ!");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    try {
      await mintWeaponOnChain(signer, recipe.name, recipe.description, recipe.image);
      
      // Consume materials
      setGameState(prev => {
        const newMaterials = { ...prev.materials };
        recipe.materials.forEach(m => {
          newMaterials[m.materialId] -= m.count;
        });
        return { ...prev, materials: newMaterials };
      });

      await refreshWeapons();
      setError("คราฟอาวุธสำเร็จ!");
      setTimeout(() => setError(null), 3000);
    } catch (err: any) {
      setError(err.message || "Crafting failed");
    } finally {
      setLoading(false);
    }
  };

  const renderInventory = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Equipped Weapon */}
        <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sword className="text-blue-400" /> อาวุธที่สวมใส่
          </h3>
          {getEquippedWeapon() ? (
            <div className="flex gap-6 items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/40 transition-all"></div>
                <img src={getEquippedWeapon()?.image} alt="Weapon" className="w-32 h-32 relative object-contain drop-shadow-2xl" />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-blue-100">{getEquippedWeapon()?.itemName}</h4>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1 text-red-400 font-mono"><Zap size={16}/> ATK: {getEquippedWeapon()?.damage}</span>
                  <span className="flex items-center gap-1 text-green-400 font-mono"><Zap size={16} className="rotate-45"/> SPD: {getEquippedWeapon()?.speed}</span>
                  <span className="flex items-center gap-1 text-blue-400 font-mono"><Shield size={16}/> HP+: {getEquippedWeapon()?.hpBonus}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2 italic">{getEquippedWeapon()?.description}</p>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl text-gray-500">
              ไม่ได้เลือกอาวุธสำหรับต่อสู้
            </div>
          )}
        </section>

        {/* Materials */}
        <section className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <LayoutGrid className="text-orange-400" /> วัสดุในคลัง
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {MATERIALS.map(m => (
              <div key={m.id} className="relative group cursor-help">
                <div className="bg-black/40 rounded-xl p-2 border border-white/5 flex flex-col items-center">
                  <img src={m.image} alt={m.name} className="w-10 h-10 object-contain" />
                  <span className="text-xs font-bold mt-1 text-orange-200">{gameState.materials[m.id] || 0}</span>
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 hidden group-hover:block z-20 pointer-events-none">
                   <div className="bg-gray-800 text-[10px] p-2 rounded-lg border border-white/10 shadow-2xl text-center">
                      <p className="font-bold">{m.name}</p>
                      <p className="text-gray-400">{m.description}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Weapons List */}
      <section>
        <h3 className="text-2xl font-bold mb-6">อาวุธทั้งหมดของคุณ ({weapons.length})</h3>
        {weapons.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
            <Hammer className="mx-auto w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">คุณยังไม่มีอาวุธ ลองไปคราฟที่เมนู Crafting ดูสิ!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {weapons.map((w, idx) => (
              <motion.div 
                key={w.tokenId}
                whileHover={{ y: -5 }}
                className={`group relative bg-gradient-to-br from-white/10 to-transparent p-4 rounded-3xl border ${gameState.equippedWeaponId === w.tokenId ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'border-white/10'}`}
              >
                <div className="aspect-square relative flex items-center justify-center bg-black/40 rounded-2xl overflow-hidden mb-4">
                  <img src={w.image} alt={w.itemName} className="w-4/5 h-4/5 object-contain group-hover:scale-110 transition-transform" />
                  <div className="absolute top-2 right-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full border ${
                      w.rarity === 'Common' ? 'bg-gray-500/20 text-gray-300 border-gray-500/40' :
                      w.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                      w.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                      'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    }`}>
                      {w.rarity}
                    </span>
                  </div>
                </div>
                <h4 className="font-bold text-lg">{w.itemName}</h4>
                <div className="flex flex-col gap-1 mt-1 text-[10px] font-mono">
                   <div className="flex justify-between">
                      <span className="text-red-400">ATK: {w.damage}</span>
                      <span className="text-green-400">SPD: {w.speed}</span>
                   </div>
                   <span className="text-blue-400">HP BONUS: +{w.hpBonus}</span>
                </div>
                <button 
                  onClick={() => equipWeapon(w.tokenId!)}
                  disabled={gameState.equippedWeaponId === w.tokenId}
                  className={`w-full mt-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    gameState.equippedWeaponId === w.tokenId 
                    ? 'bg-blue-500/20 text-blue-400 cursor-default' 
                    : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {gameState.equippedWeaponId === w.tokenId ? 'สวมใส่แล้ว' : 'สวมใส่'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderCrafting = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {RECIPES.map(recipe => {
        const canCraft = recipe.materials.every(rm => (gameState.materials[rm.materialId] || 0) >= rm.count);
        return (
          <div key={recipe.id} className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col shadow-xl">
             <div className="aspect-video bg-black/40 rounded-2xl relative flex items-center justify-center mb-6">
                <img src={recipe.image} alt={recipe.name} className="w-1/2 h-4/5 object-contain" />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <div className="bg-red-500/20 text-red-400 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                      <Zap size={12}/> {recipe.baseDamage}
                   </div>
                   <div className="bg-green-500/20 text-green-400 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                      <ChevronRight size={12} className="rotate-45"/> {recipe.baseSpeed}
                   </div>
                   <div className="bg-blue-500/20 text-blue-400 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                      <Shield size={12}/> +{recipe.baseHpBonus}
                   </div>
                </div>
             </div>
             
             <div className="flex-1">
                <h4 className="text-xl font-bold mb-2">{recipe.name}</h4>
                <p className="text-sm text-gray-400 mb-6">{recipe.description}</p>
                
                <div className="space-y-3 mb-8">
                   <p className="text-xs uppercase font-bold text-gray-500">วัสดุที่ต้องการ:</p>
                   {recipe.materials.map(rm => {
                      const material = MATERIALS.find(m => m.id === rm.materialId);
                      const currentCount = gameState.materials[rm.materialId] || 0;
                      const isEnough = currentCount >= rm.count;
                      return (
                        <div key={rm.materialId} className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5">
                           <div className="flex items-center gap-2">
                              <img src={material?.image} alt="" className="w-6 h-6 object-contain" />
                              <span className="text-sm">{material?.name}</span>
                           </div>
                           <span className={`text-sm font-mono ${isEnough ? 'text-green-400' : 'text-red-400'}`}>
                              {currentCount}/{rm.count}
                           </span>
                        </div>
                      );
                   })}
                </div>
             </div>

             <button 
                onClick={() => handleCraft(recipe)}
                disabled={loading || !canCraft || !address}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  loading || !canCraft || !address
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:scale-[1.02] active:scale-95 shadow-orange-500/20'
                }`}
             >
                {loading ? 'กำลับคราฟ...' : !address ? 'โปรดเชื่อมต่อ Wallet' : canCraft ? 'เริ่มสร้างไอเทม (MINT)' : 'วัสดุปลไม่พอ'}
             </button>
          </div>
        )
      })}
    </div>
  );

  const renderBestiary = () => (
    <div className="space-y-12">
      <header className="max-w-2xl">
         <h3 className="text-3xl font-bold mb-4">หอสมุดมอนสเตอร์</h3>
         <p className="text-gray-400">ค้นพบมอนสเตอร์ที่คุณเคยโค่นล้ม และออกตามหาตนใหม่ๆ เพื่อสะสม Monster Card และวัสดุหายาก</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MONSTERS.map(monster => {
          const isDefeated = gameState.monsterCards.includes(monster.id);
          return (
            <div key={monster.id} className={`group bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative ${!isDefeated && 'grayscale opacity-80'}`}>
              <div className="h-64 relative bg-black/40 overflow-hidden">
                <img src={monster.image} alt={monster.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                   <h4 className="text-2xl font-bold">{monster.name}</h4>
                   <p className="text-xs text-gray-400">{isDefeated ? 'พบเจอแล้ว' : 'ยังไม่เคยพบเจอ'}</p>
                </div>
                {isDefeated && (
                  <div className="absolute top-4 left-4 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold border border-green-500/30 flex items-center gap-1">
                     <CheckCircle2 size={10}/> COLLECTED
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-400 mb-6 h-10 line-clamp-2">{monster.description}</p>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-6">
                   <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <p className="text-gray-500 text-[10px] uppercase">Health</p>
                      <p className="text-blue-300">{monster.maxHp}</p>
                   </div>
                   <div className="bg-black/30 p-2 rounded-xl border border-white/5">
                      <p className="text-gray-500 text-[10px] uppercase">Attack</p>
                      <p className="text-red-300">{monster.damage}</p>
                   </div>
                </div>
                <button 
                  onClick={() => startBattle(monster)}
                  className="w-full py-3 bg-red-600/20 text-red-400 border border-red-500/20 rounded-2xl font-bold hover:bg-red-600/40 transition-all flex items-center justify-center gap-2"
                >
                  <Sword size={18} /> ออกล่าตอนนี้
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderBattle = () => {
    if (!selectedMonster) return <div className="text-center py-20 text-gray-500">เลือกมอนสเตอร์เพื่อสู้!</div>;
    const equipped = getEquippedWeapon();

    return (
      <div className="max-w-5xl mx-auto space-y-12">
         {/* Battle Arena */}
         <div className="relative h-[400px] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
            <div className="absolute inset-0">
               <img src={BACKGROUND_IMAGE} className="w-full h-full object-cover" alt="Background" />
               <div className="absolute inset-0 bg-black/40"></div>
            </div>

            <div className="relative h-full flex items-center justify-around px-8">
               {/* Player */}
               <motion.div 
                 animate={battleState === 'fighting' ? { x: [0, 20, 0] } : {}}
                 transition={{ repeat: Infinity, duration: 1.5 }}
                 className="flex flex-col items-center gap-4"
               >
                  <div className="relative">
                    {/* Shadow/Glow */}
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                    <img src={equipped?.image} className="w-48 h-48 object-contain relative drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
                  </div>
                  <div className="w-48 bg-gray-900/80 rounded-full h-4 p-1 border border-white/10 overflow-hidden">
                     <motion.div 
                       className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full" 
                       initial={{ width: '100%' }}
                       animate={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                     />
                  </div>
                  <span className="text-xs font-mono font-bold">YOU: {playerHp}/{playerMaxHp} HP</span>
               </motion.div>

               {/* VS Icon */}
               <div className="text-4xl font-black italic text-red-500 drop-shadow-2xl opacity-20">VS</div>

               {/* Monster */}
               <motion.div 
                 animate={battleState === 'fighting' ? { x: [0, -20, 0] } : {}}
                 transition={{ repeat: Infinity, duration: 1.5, delay: 0.75 }}
                 className="flex flex-col items-center gap-4"
               >
                  <img src={selectedMonster.image} className="w-56 h-56 object-contain drop-shadow-[0_0_30px_rgba(239,68,68,0.3)]" />
                  <div className="w-48 bg-gray-900/80 rounded-full h-4 p-1 border border-white/10 overflow-hidden">
                     <motion.div 
                        className="h-full bg-gradient-to-r from-red-600 to-orange-400 rounded-full" 
                        initial={{ width: '100%' }}
                        animate={{ width: `${(monsterHp / selectedMonster.maxHp) * 100}%` }}
                     />
                  </div>
                  <span className="text-xs font-mono font-bold">{selectedMonster.name}: {monsterHp}/{selectedMonster.maxHp} HP</span>
               </motion.div>
            </div>

            {/* Damage Popups mockup could go here */}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Battle Feed */}
            <div className="md:col-span-2 bg-black/40 backdrop-blur-md rounded-3xl p-6 border border-white/10 h-64 flex flex-col">
               <h4 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertCircle size={18}/> บันทึกการต่อสู้</h4>
               <div className="flex-1 space-y-2 overflow-y-auto font-mono text-sm">
                  {battleLog.map((log, i) => (
                    <div key={i} className={`p-2 rounded-lg ${log.includes('คุณ') ? 'bg-blue-500/10 text-blue-200' : 'bg-red-500/10 text-red-200'}`}>
                       {log}
                    </div>
                  ))}
               </div>
            </div>

            {/* Results */}
            <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col justify-center items-center">
               <AnimatePresence mode="wait">
                  {battleState === 'won' && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                       <div className="bg-green-500/20 p-4 rounded-full mb-4 inline-block">
                          <CheckCircle2 size={48} className="text-green-500"/>
                       </div>
                       <h4 className="text-3xl font-bold text-green-400 mb-2">ชัยชนะ!</h4>
                       <p className="text-gray-400 mb-6 text-sm">คุณได้รับประสบการณ์และไอเทม!</p>
                       <button onClick={() => setActiveTab('inventory')} className="w-full py-3 bg-white text-black font-bold rounded-2xl hover:bg-gray-200">เข้าคลังไอเทม</button>
                    </motion.div>
                  )}
                  {battleState === 'lost' && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                       <div className="bg-red-500/20 p-4 rounded-full mb-4 inline-block">
                          <X size={48} className="text-red-500"/>
                       </div>
                       <h4 className="text-3xl font-bold text-red-400 mb-2">พ่ายแพ้...</h4>
                       <p className="text-gray-400 mb-6 text-sm">กลับไปคราฟอาวุธที่แข็งแกร่งกว่าเดิม</p>
                       <button onClick={() => setActiveTab('bestiary')} className="w-full py-3 bg-white text-black font-bold rounded-2xl hover:bg-gray-200">กลับไปยังแผนที่</button>
                    </motion.div>
                  )}
                  {battleState === 'fighting' && (
                    <motion.div className="text-center">
                       <div className="relative mb-6">
                          <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center font-bold">...</div>
                       </div>
                       <p className="text-gray-400">กำลังต่อสู้ดุเดือด...</p>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-thai selection:bg-blue-500/30">
      {/* HUD Bar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <div className="bg-white/5 backdrop-blur-2xl px-6 py-4 rounded-[32px] border border-white/10 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center font-black italic text-xl shadow-lg shadow-blue-500/20 text-white">E</div>
             <div>
                <h1 className="text-lg font-bold leading-none">EtherQuest</h1>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Monster Hunter v1.0</p>
             </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleConnect}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-2xl font-bold transition-all shadow-md ${
                address 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              <Wallet size={16} />
              {loading ? 'กำลังเชื่อมต่อ...' : address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'เชื่อมต่อ Wallet'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-32 pb-40 px-6 max-w-7xl mx-auto">
         <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'battle' && renderBattle()}
              {activeTab === 'inventory' && renderInventory()}
              {activeTab === 'craft' && renderCrafting()}
              {activeTab === 'bestiary' && renderBestiary()}
            </motion.div>
         </AnimatePresence>
      </main>

      {/* Navigation Dock */}
      <footer className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-3xl px-3 py-3 rounded-[32px] border border-white/10 shadow-2xl flex items-center gap-1">
          <TabButton active={activeTab === 'inventory'} icon={<LayoutGrid size={22}/>} label="Inventory" onClick={() => setActiveTab('inventory')} />
          <TabButton active={activeTab === 'craft'} icon={<Hammer size={22}/>} label="Crafting" onClick={() => setActiveTab('craft')} />
          <TabButton active={activeTab === 'bestiary'} icon={<Ghost size={22}/>} label="Hunt" onClick={() => setActiveTab('bestiary')} />
          <TabButton active={activeTab === 'battle'} icon={<Sword size={22}/>} label="Battle" onClick={() => setActiveTab('battle')} />
        </div>
      </footer>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl flex items-center gap-3 border shadow-2xl ${
              error.includes('สำเร็จ') ? 'bg-green-600/90 border-green-400 text-white' : 'bg-red-600/90 border-red-400 text-white'
            }`}
          >
            {error.includes('สำเร็จ') ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
            <span className="font-bold">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-4 rounded-3xl flex items-center gap-3 transition-all relative ${
        active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
        : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className={`text-sm font-bold ${active ? 'block' : 'hidden md:block'}`}>{label}</span>
    </button>
  );
}
