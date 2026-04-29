/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CHAIN_ID, RECIPES } from '../constants';
import { Weapon } from '../types';

const ABI = [
  "function mintWeapon(address to, string memory itemName, string memory description, string memory image) public",
  "function getMyWeapons() public view returns (tuple(string itemName, string description, string image, bool isUsed, address owner)[] memory)",
  "function useWeapon(uint256 tokenId) public",
  "function getWeapon(uint256 tokenId) public view returns (tuple(string itemName, string description, string image, bool isUsed, address owner) memory)",
  "function nextTokenId() public view returns (uint256)"
];

export async function getEthereumProvider() {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
}

export async function isContractDeployed(provider: ethers.Provider, address: string) {
  const code = await provider.getCode(address);
  return code !== "0x";
}

export async function connectWallet() {
  const provider = await getEthereumProvider();
  if (!provider) throw new Error("MetaMask not found");
  
  await provider.send("eth_requestAccounts", []);
  
  const network = await provider.getNetwork();
  
  if (network.chainId !== BigInt(31337)) {
    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: CHAIN_ID }]);
    } catch (err: any) {
      if (err.code === 4902) {
        await provider.send("wallet_addEthereumChain", [{
          chainId: CHAIN_ID,
          chainName: "Localhost 8545",
          nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: ["http://localhost:8545"]
        }]);
      } else {
        throw new Error("โปรดสลับไปยัง Hardhat Network (Chain ID 31337)");
      }
    }
  }

  const isDeployed = await isContractDeployed(provider, CONTRACT_ADDRESS);
  if (!isDeployed) {
    throw new Error(`ไม่พบ Smart Contract ที่ address ${CONTRACT_ADDRESS} บน network นี้ โปรดตรวจสอบว่าได้ deploy contract แล้วหรือยัง`);
  }
  
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

export async function getContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}

export async function fetchMyWeapons(signer: ethers.Signer): Promise<Weapon[]> {
  const contract = await getContract(signer);
  const data = await contract.getMyWeapons();
  const address = await signer.getAddress();
  
  return data.map((w: any, index: number) => {
    // We need to match the weapon with stats from our recipes
    const recipe = RECIPES.find(r => r.name === w.itemName);
    
    return {
      tokenId: index, // The contract use nextTokenId, local index works if getMyWeapons returns ordered
      itemName: w.itemName,
      description: w.description,
      image: w.image,
      isUsed: w.isUsed,
      owner: w.owner,
      damage: recipe?.baseDamage || 10,
      speed: recipe?.baseSpeed || 5,
      hpBonus: recipe?.baseHpBonus || 0,
      rarity: recipe?.rarity || 'Common'
    };
  });
}

export async function mintWeaponOnChain(signer: ethers.Signer, name: string, description: string, image: string) {
  const contract = await getContract(signer);
  const address = await signer.getAddress();
  const tx = await contract.mintWeapon(address, name, description, image);
  await tx.wait();
  return tx;
}
