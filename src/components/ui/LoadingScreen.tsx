'use client';

import React from 'react';
import { 
  FaUmbrellaBeach, 
  FaTree, 
  FaMountain, 
  FaGem, 
  FaGlobe,
  FaDice 
} from 'react-icons/fa';

interface LoadingScreenProps {
  biomeName: string;
  seed: string;
  progress?: number;
}

export default function LoadingScreen({ biomeName, seed, progress = 0 }: LoadingScreenProps) {
  const getBiomeIcon = (biomeName: string) => {
    switch (biomeName.toLowerCase()) {
      case 'beach': return <FaUmbrellaBeach className="w-20 h-20" />;
      case 'forest': return <FaTree className="w-20 h-20" />;
      case 'mountain': return <FaMountain className="w-20 h-20" />;
      case 'crystal cave': return <FaGem className="w-20 h-20" />;
      default: return <FaGlobe className="w-20 h-20" />;
    }
  };

  const getBiomeAccentColor = (biomeName: string) => {
    switch (biomeName.toLowerCase()) {
      case 'beach': return 'from-blue-500 to-yellow-400';
      case 'forest': return 'from-green-500 to-green-400';
      case 'mountain': return 'from-gray-400 to-white';
      case 'crystal cave': return 'from-purple-500 to-pink-400';
      default: return 'from-gray-400 to-gray-300';
    }
  };

  const getBiomeProgressColor = (biomeName: string) => {
    switch (biomeName.toLowerCase()) {
      case 'beach': return 'bg-gradient-to-r from-blue-500 to-yellow-400';
      case 'forest': return 'bg-gradient-to-r from-green-500 to-green-400';
      case 'mountain': return 'bg-gradient-to-r from-gray-400 to-white';
      case 'crystal cave': return 'bg-gradient-to-r from-purple-500 to-pink-400';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-300';
    }
  };

  const loadingMessages = [
    '🌱 Planting the seeds of your world...',
    '🏗️ Crafting the landscape...',
    '🎨 Painting the terrain...',
    '✨ Adding magical touches...',
    '🔧 Fine-tuning the details...',
    '🌟 Almost ready for exploration!'
  ];

  const currentMessage = loadingMessages[Math.floor((progress / 100) * loadingMessages.length)] || loadingMessages[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Animated biome icon */}
        <div className="mb-8 animate-bounce flex justify-center">
          <div className={`p-6 rounded-full bg-gradient-to-br ${getBiomeAccentColor(biomeName)} bg-opacity-20 backdrop-blur-sm`}>
            {getBiomeIcon(biomeName)}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
          Generating {biomeName}
        </h1>

        {/* Seed display */}
        <div className="bg-gray-800 border border-gray-600 backdrop-blur-sm rounded-xl p-4 mb-8">
          <p className="text-white text-lg flex items-center justify-center">
            <FaDice className="w-5 h-5 mr-2 text-gray-300" />
            <span className="font-semibold">Seed:</span> 
            <span className="ml-2 text-gray-300">{seed}</span>
          </p>
        </div>

        {/* Loading animation */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4 border border-gray-600">
            <div
              className={`${getBiomeProgressColor(biomeName)} h-4 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          {/* Progress percentage */}
          <div className="text-white text-lg font-semibold mb-4">
            {`${Math.round(progress)}%`}
          </div>

          {/* Loading message */}
          <p className="text-gray-300 text-lg">
            {currentMessage}
          </p>
        </div>

        {/* Spinning loader */}
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
} 