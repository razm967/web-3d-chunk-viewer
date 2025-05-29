'use client';

import React, { useState, useEffect } from 'react';
import { getAvailableBiomes, Biome } from '@/lib/biomeManager';
import { 
  FaUmbrellaBeach, 
  FaTree, 
  FaMountain, 
  FaGem, 
  FaGlobe,
  FaChevronDown,
  FaRocket,
  FaDice
} from 'react-icons/fa';

interface EntrancePageProps {
  onBiomeSelect: (biomeId: string, seed: string) => Promise<void>;
}

export default function EntrancePage({ onBiomeSelect }: EntrancePageProps) {
  const [availableBiomes, setAvailableBiomes] = useState<Biome[]>([]);
  const [selectedBiome, setSelectedBiome] = useState<string>('');
  const [seed, setSeed] = useState('hello world');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setAvailableBiomes(getAvailableBiomes());
    
    // Preload all HDRs in the background
    const preloadHDRs = async () => {
      const biomes = getAvailableBiomes();
      
      for (const biome of biomes) {
        if (biome.settings.hdrPath) {
          try {
            await new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = resolve;
              img.onerror = resolve; // Continue even if HDR fails
              img.src = biome.settings.hdrPath || '';
            });
          } catch (error) {
            console.warn(`Failed to preload HDR for ${biome.displayName}:`, error);
          }
        }
      }
      console.log('All HDRs preloaded');
    };
    
    preloadHDRs();
  }, []);

  const handleExploreWorld = async () => {
    if (!selectedBiome) return;
    
    await onBiomeSelect(selectedBiome, seed);
  };

  const getBiomeDescription = (biomeId: string) => {
    switch (biomeId) {
      case 'beach':
        return 'Explore sandy shores with palm trees and crystal-clear waters.';
      case 'forest':
        return 'Venture into dense woodlands filled with towering trees.';
      case 'mountain':
        return 'Conquer snowy peaks and rocky terrain in alpine environment.';
      case 'crystalCave':
        return 'Discover mysterious underground caverns with glowing crystals.';
      default:
        return 'An unexplored realm awaits your discovery.';
    }
  };

  const getBiomeIcon = (biomeId: string) => {
    switch (biomeId) {
      case 'beach': return <FaUmbrellaBeach className="w-8 h-8" />;
      case 'forest': return <FaTree className="w-8 h-8" />;
      case 'mountain': return <FaMountain className="w-8 h-8" />;
      case 'crystalCave': return <FaGem className="w-8 h-8" />;
      default: return <FaGlobe className="w-8 h-8" />;
    }
  };

  const selectedBiomeData = availableBiomes.find(b => b.id === selectedBiome);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <FaGlobe className="w-16 h-16 text-gray-300 mr-4" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Voxel World Explorer
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Choose your adventure and explore procedurally generated worlds
          </p>
        </div>

        {/* Biome Selection Dropdown */}
        <div className="mb-8">
          <label className="block text-white text-lg font-semibold mb-3">
            Select Biome
          </label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl px-6 py-4 text-left flex items-center justify-between transition-all duration-200"
            >
              <div className="flex items-center">
                {selectedBiomeData ? (
                  <>
                    <div className="text-gray-300 mr-4">
                      {getBiomeIcon(selectedBiome)}
                    </div>
                    <div>
                      <div className="text-white font-semibold text-lg">
                        {selectedBiomeData.displayName}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {getBiomeDescription(selectedBiome)}
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">Choose a biome...</span>
                )}
              </div>
              <FaChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-xl z-10 max-h-80 overflow-y-auto">
                {availableBiomes.map((biome) => (
                  <button
                    key={biome.id}
                    onClick={() => {
                      setSelectedBiome(biome.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-6 py-4 text-left hover:bg-gray-700 transition-all duration-200 flex items-center ${
                      selectedBiome === biome.id ? 'bg-gray-700' : ''
                    } ${biome.id === availableBiomes[0].id ? 'rounded-t-xl' : ''} ${
                      biome.id === availableBiomes[availableBiomes.length - 1].id ? 'rounded-b-xl' : ''
                    }`}
                  >
                    <div className="text-gray-300 mr-4">
                      {getBiomeIcon(biome.id)}
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {biome.displayName}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {getBiomeDescription(biome.id)}
                      </div>
                    </div>
                    {selectedBiome === biome.id && (
                      <div className="ml-auto">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Seed Input */}
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 mb-8">
          <label className="flex items-center text-white text-lg font-semibold mb-3">
            <FaDice className="w-5 h-5 mr-2" />
            World Seed (Optional)
          </label>
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
            placeholder="Enter a custom seed or leave default..."
          />
          <p className="text-gray-400 text-sm mt-2">
            Use the same seed to generate identical worlds, or change it for a new adventure!
          </p>
        </div>

        {/* Explore Button */}
        <div className="text-center">
          <button
            onClick={handleExploreWorld}
            disabled={!selectedBiome}
            className={`
              px-12 py-4 rounded-xl text-xl font-bold transition-all duration-300 transform flex items-center justify-center mx-auto
              ${selectedBiome 
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 hover:shadow-xl cursor-pointer' 
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <FaRocket className="w-6 h-6 mr-3" />
            {selectedBiome ? (
              <>
                Explore {selectedBiomeData?.displayName}
              </>
            ) : (
              'Select a Biome to Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 