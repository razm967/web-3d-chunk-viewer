'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useState, ChangeEvent, KeyboardEvent } from 'react';
import Chunk from './Chunk';
import { 
  CHUNK_SIZE, 
  CHUNK_HEIGHT,
  Voxel 
} from '@/lib/chunkUtils';
import { biomes } from '@/lib/biomeManager';

export default function Scene() {
  const [currentSeed, setCurrentSeed] = useState<string>('hello world');
  const [currentBiome, setCurrentBiome] = useState<string>('desert');
  const [voxelData, setVoxelData] = useState<Voxel[]>(() => biomes[currentBiome].generateChunkData(currentSeed));
  const [showWireframe, setShowWireframe] = useState(false);
  const [key, setKey] = useState(0);

  const handleSeedChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentSeed(event.target.value);
  };

  const handleBiomeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCurrentBiome(event.target.value);
    setVoxelData(biomes[event.target.value].generateChunkData(currentSeed));
    setKey(prevKey => prevKey + 1);
  };

  const regenerateChunkWithSeed = () => {
    console.log("Regenerating with seed:", currentSeed);
    setVoxelData(biomes[currentBiome].generateChunkData(currentSeed));
    setKey(prevKey => prevKey + 1);
  };

  const handleSeedInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      regenerateChunkWithSeed();
    }
  };

  const toggleWireframe = () => {
    setShowWireframe(prev => !prev);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Canvas style={{ background: 'lightblue' }} shadows={true}> 
        <PerspectiveCamera 
          makeDefault 
          position={[CHUNK_SIZE * 0.75, CHUNK_HEIGHT * 0.75, CHUNK_SIZE * 1.25]}
          fov={60} 
        />
        <ambientLight intensity={1.5} /> 
        <directionalLight 
          position={[CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE * 0.5]} 
          intensity={2.0} 
          castShadow 
        />
        <pointLight 
          position={[-CHUNK_SIZE / 2, CHUNK_HEIGHT / 2, -CHUNK_SIZE / 2]} 
          intensity={0.8} 
        />

        <Suspense fallback={null}>
          <Chunk 
            key={key} 
            voxelData={voxelData} 
            showWireframe={showWireframe} 
            position={[0,0,0]} 
            hdrPath={biomes[currentBiome].settings.hdrPath}
          />
        </Suspense>
        
        <OrbitControls target={[0, CHUNK_HEIGHT / 3, 0]} />
        <Stats />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(20, 20, 20, 0.85)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '260px'
      }}>
        <p style={{textAlign: 'center', fontWeight: 'bold', marginBottom: '5px'}}>Voxel Terrain</p>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="biomeSelect" style={{ marginBottom: '5px', fontSize: '0.9em', color: '#DDD' }}>Biome:</label>
          <select
            id="biomeSelect"
            value={currentBiome}
            onChange={handleBiomeChange}
            style={{ 
              padding: '8px 10px',
              borderRadius: '4px',
              border: '1px solid #777',
              backgroundColor: '#444',
              color: '#FFF',
              fontSize: '0.9em'
            }}
          >
            {Object.values(biomes).map(biome => (
              <option key={biome.id} value={biome.id}>
                {biome.displayName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="seedInput" style={{ marginBottom: '5px', fontSize: '0.9em', color: '#DDD' }}>Seed:</label>
          <input 
            type="text" 
            id="seedInput"
            value={currentSeed} 
            onChange={handleSeedChange} 
            onKeyDown={handleSeedInputKeyDown}
            style={{ 
              padding: '8px 10px',
              borderRadius: '4px', 
              border: '1px solid #777',
              backgroundColor: '#444',
              color: '#FFF',
              fontSize: '0.9em'
            }}
          />
        </div>
        
        <button 
          onClick={regenerateChunkWithSeed} 
          style={{ 
            padding: '10px 12px',
            background: '#007bff',
            border: 'none', 
            color: 'white', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '0.95em' 
          }}
        >
          Regenerate Terrain
        </button>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
          <input type="checkbox" checked={showWireframe} onChange={toggleWireframe} />
          Show Wireframe
        </label>
      </div>
    </div>
  );
} 