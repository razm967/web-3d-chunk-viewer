'use client';

import { Suspense, useState, useEffect, KeyboardEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stats } from '@react-three/drei';
import Chunk from '@/components/canvas/Chunk';
import { Voxel, CHUNK_SIZE, CHUNK_HEIGHT } from '@/lib/chunkUtils';
import {
  getAvailableBiomes,
  getBiomeById,
  generateBiomeSpecificSeed,
  Biome
} from '@/lib/biomeManager'; // Import biome utilities

const DEFAULT_BIOME_ID = 'beach'; // Or your preferred default

export default function HomePage() {
  const [availableBiomes, setAvailableBiomes] = useState<Biome[]>([]);
  const [currentBiomeId, setCurrentBiomeId] = useState<string>(DEFAULT_BIOME_ID);
  const [terrainData, setTerrainData] = useState<Voxel[] | null>(null);
  const [currentSeed, setCurrentSeed] = useState('hello world'); // Generic initial seed
  const [seedInput, setSeedInput] = useState('hello world');
  const [currentHdrPath, setCurrentHdrPath] = useState<string>('');

  // Load available biomes on mount
  useEffect(() => {
    setAvailableBiomes(getAvailableBiomes());
  }, []);

  const generateAndSetTerrain = (biomeId: string, seed: string) => {
    const selectedBiome = getBiomeById(biomeId);
    if (!selectedBiome) {
      console.error(`Biome with ID "${biomeId}" not found.`);
      setTerrainData(null);
      setCurrentHdrPath('');
      return;
    }

    const biomeSpecificSeed = generateBiomeSpecificSeed(biomeId, seed);
    console.log(`[page.tsx] Generating terrain for biome: ${selectedBiome.displayName}, Seed: ${seed}, BiomeSpecificSeed: ${biomeSpecificSeed}`);
    console.log(`[page.tsx] Biome settings hdrPath: ${selectedBiome.settings.hdrPath}`); // Log the raw hdrPath from settings
    const newTerrainData = selectedBiome.generateChunkData(biomeSpecificSeed);
    setTerrainData(newTerrainData);
    const newHdrPath = selectedBiome.settings.hdrPath || '';
    setCurrentHdrPath(newHdrPath);
    console.log(`[page.tsx] Terrain data length: ${newTerrainData?.length}, Current HDR Path set to: "${newHdrPath}"`);
  };

  // Effect to regenerate terrain when currentBiomeId or currentSeed changes
  useEffect(() => {
    if (currentBiomeId && currentSeed) {
      generateAndSetTerrain(currentBiomeId, currentSeed);
    }
  }, [currentBiomeId, currentSeed]);

  const handleSeedInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeedInput(event.target.value);
  };

  const handleBiomeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentBiomeId(event.target.value);
    // Optionally, you might want to reset the seed or generate with the current seed for the new biome immediately.
    // For now, it will regenerate on the next manual regenerate or if currentSeed changes.
  };

  const handleRegenerateClick = () => {
    setCurrentSeed(seedInput); // This will trigger the useEffect above
    // generateAndSetTerrain(currentBiomeId, seedInput); // Direct call, also an option
  };

  const handleSeedInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setCurrentSeed(seedInput);
    }
  };
  
  const selectedBiomeDisplayName = getBiomeById(currentBiomeId)?.displayName || 'Unknown Biome';

  console.log(`[page.tsx] Rendering Chunk. terrainData is ${terrainData ? 'set' : 'null'}, currentHdrPath is "${currentHdrPath}"`);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        fontFamily: 'sans-serif'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2em' }}>
          {/* Display current biome name */}
          3D Voxel World ({selectedBiomeDisplayName} {CHUNK_SIZE}x{CHUNK_HEIGHT}x{CHUNK_SIZE})
        </h3>
        <div>
          <label htmlFor="biomeSelect" style={{ marginRight: '5px' }}>Biome: </label>
          <select 
            id="biomeSelect" 
            value={currentBiomeId} 
            onChange={handleBiomeChange}
            style={{ padding: '5px', borderRadius: '3px', border: '1px solid #555', background: '#333', color: 'white' }}
          >
            {availableBiomes.map(biome => (
              <option key={biome.id} value={biome.id}>
                {biome.displayName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="seedInput" style={{ marginRight: '5px' }}>Seed: </label>
          <input 
            id="seedInput" 
            type="text" 
            value={seedInput} 
            onChange={handleSeedInputChange}
            onKeyDown={handleSeedInputKeyDown}
            style={{ 
              padding: '5px', 
              borderRadius: '3px', 
              border: '1px solid #555', 
              background: '#333', 
              color: 'white' 
            }}
          />
        </div>
        <button 
          onClick={handleRegenerateClick} 
          style={{ 
            padding: '8px 12px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '3px', 
            cursor: 'pointer' 
          }}
        >
          Regenerate Terrain
        </button>
        <div>Current Biome: {selectedBiomeDisplayName}</div>
        <div>Current Seed (for biome): {currentSeed}</div>
        <div>Chunk Size: {CHUNK_SIZE}x{CHUNK_HEIGHT}x{CHUNK_SIZE}</div> 
      </div>
      <Canvas style={{ background: '#27272a' }}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[CHUNK_SIZE * 0.75, CHUNK_HEIGHT * 1.5, CHUNK_SIZE * 0.75]} fov={75} />
          <OrbitControls target={[0, 0, 0]} /> 
          <ambientLight intensity={0.8} />
          <directionalLight 
            position={[CHUNK_SIZE / 2, CHUNK_HEIGHT * 2, CHUNK_SIZE / 4]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048} 
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-CHUNK_SIZE / 2, -CHUNK_HEIGHT, -CHUNK_SIZE / 2]} intensity={0.5} />

          {terrainData && <Chunk voxelData={terrainData} hdrPath={currentHdrPath} />}
        </Suspense>
        <Stats />
      </Canvas>
    </div>
  );
}
