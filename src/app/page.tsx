'use client';

import { Suspense, useState, KeyboardEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, FlyControls } from '@react-three/drei';
import Chunk from '@/components/canvas/Chunk';
import FirstPersonCamera from '@/components/canvas/FirstPersonCamera';
import { Voxel, CHUNK_SIZE, CHUNK_HEIGHT } from '@/lib/chunkUtils';
import {
  getBiomeById,
  generateBiomeSpecificSeed,
} from '@/lib/biomeManager';
import EntrancePage from '@/components/ui/EntrancePage';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { 
  FaUmbrellaBeach, 
  FaTree, 
  FaMountain, 
  FaGem, 
  FaGlobe,
  FaArrowLeft,
  FaCog,
  FaTimes,
  FaDice,
  FaRocket,
  FaEye,
  FaCamera,
  FaPlane
} from 'react-icons/fa';

type AppState = 'entrance' | 'loading' | 'world';
type CameraMode = 'orbit' | 'firstPerson' | 'fly';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('entrance');
  const [selectedBiome, setSelectedBiome] = useState<string>('');
  const [selectedSeed, setSelectedSeed] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  
  // World viewer state
  const [terrainData, setTerrainData] = useState<Voxel[] | null>(null);
  const [currentHdrPath, setCurrentHdrPath] = useState<string>('');
  const [seedInput, setSeedInput] = useState('');
  const [showControls, setShowControls] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit');

  const handleBiomeSelect = async (biomeId: string, seed: string) => {
    setSelectedBiome(biomeId);
    setSelectedSeed(seed);
    setSeedInput(seed);
    setLoadingProgress(0);
    
    // Generate terrain data immediately
    const selectedBiomeData = getBiomeById(biomeId);
    if (!selectedBiomeData) {
      console.error(`Biome with ID "${biomeId}" not found.`);
      setAppState('entrance');
      return;
    }

    const biomeSpecificSeed = generateBiomeSpecificSeed(biomeId, seed);
    console.log(`[page.tsx] Generating terrain for biome: ${selectedBiomeData.displayName}, Seed: ${seed}`);
    
    // Set terrain data and switch to world view immediately so 3D rendering starts
    const newTerrainData = selectedBiomeData.generateChunkData(biomeSpecificSeed);
    setTerrainData(newTerrainData);
    setCurrentHdrPath(selectedBiomeData.settings.hdrPath || '');
    setAppState('world');
    setShowLoadingOverlay(true);
    
    // Show loading overlay for 6 seconds while 3D renders
    let progress = 0;
    const interval = setInterval(() => {
      progress += 100 / 60; // 60 steps over 6 seconds
      setLoadingProgress(Math.min(progress, 100));
      
      if (progress >= 100) {
        clearInterval(interval);
        setShowLoadingOverlay(false);
      }
    }, 100); // Update every 100ms
  };

  const handleCameraModeChange = () => {
    // Exit pointer lock if currently active before switching modes
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    const nextMode = cameraMode === 'orbit' ? 'firstPerson' : 
                     cameraMode === 'firstPerson' ? 'fly' : 'orbit';
    setCameraMode(nextMode);
  };

  const handleBackToMenu = () => {
    // Exit pointer lock before going back to menu
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    setAppState('entrance');
    setSelectedBiome('');
    setSelectedSeed('');
    setLoadingProgress(0);
    setShowLoadingOverlay(false);
    setTerrainData(null);
    setShowControls(false);
    setCameraMode('orbit');
  };

  const handleRegenerateClick = async () => {
    if (!selectedBiome) return;
    
    setLoadingProgress(0);
    
    // Generate terrain in background
    const selectedBiomeData = getBiomeById(selectedBiome);
    if (!selectedBiomeData) {
      console.error(`Biome with ID "${selectedBiome}" not found.`);
      return;
    }

    // Generate terrain data immediately
    const biomeSpecificSeed = generateBiomeSpecificSeed(selectedBiome, seedInput);
    console.log(`[page.tsx] Regenerating terrain for biome: ${selectedBiomeData.displayName}, Seed: ${seedInput}`);
    
    const newTerrainData = selectedBiomeData.generateChunkData(biomeSpecificSeed);
    setTerrainData(newTerrainData);
    setCurrentHdrPath(selectedBiomeData.settings.hdrPath || '');
    setSelectedSeed(seedInput);
    setShowLoadingOverlay(true);
    
    // Show loading overlay for 6 seconds while 3D renders
    let progress = 0;
    const interval = setInterval(() => {
      progress += 100 / 60; // 60 steps over 6 seconds
      setLoadingProgress(Math.min(progress, 100));
      
      if (progress >= 100) {
        clearInterval(interval);
        setShowLoadingOverlay(false);
      }
    }, 100); // Update every 100ms
  };

  const handleSeedInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSeedInput(event.target.value);
  };

  const handleSeedInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleRegenerateClick();
    }
  };

  const getBiomeEmoji = (biomeId: string) => {
    switch (biomeId) {
      case 'beach': return <FaUmbrellaBeach size={20} />;
      case 'forest': return <FaTree size={20} />;
      case 'mountain': return <FaMountain size={20} />;
      case 'crystalCave': return <FaGem size={20} />;
      default: return <FaGlobe size={20} />;
    }
  };

  const selectedBiomeData = getBiomeById(selectedBiome);

  if (appState === 'entrance') {
    return (
      <EntrancePage 
        onBiomeSelect={handleBiomeSelect}
      />
    );
  }

  if (appState === 'loading') {
    return (
      <LoadingScreen 
        biomeName={selectedBiomeData?.displayName || 'Unknown'}
        seed={selectedSeed}
        progress={loadingProgress}
      />
    );
  }

  if (appState === 'world') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        {/* Loading Overlay */}
        {showLoadingOverlay && (
          <div className="absolute inset-0 z-50">
            <LoadingScreen 
              biomeName={selectedBiomeData?.displayName || 'Unknown'}
              seed={selectedSeed}
              progress={loadingProgress}
            />
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={handleBackToMenu}
          className="absolute top-4 left-4 z-20 bg-gray-900 bg-opacity-80 hover:bg-gray-800 hover:bg-opacity-95 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 border border-gray-600 hover:border-gray-500 backdrop-blur-sm transform hover:scale-105 active:scale-95 hover:shadow-xl active:shadow-md group"
        >
          <FaArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Menu
        </button>

        {/* Controls Toggle */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute top-4 right-4 z-20 bg-gray-900 bg-opacity-80 hover:bg-gray-800 hover:bg-opacity-95 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 border border-gray-600 hover:border-gray-500 backdrop-blur-sm transform hover:scale-105 active:scale-95 hover:shadow-xl active:shadow-md group"
        >
          {showControls ? (
            <>
              <FaTimes className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              Hide Controls
            </>
          ) : (
            <>
              <FaCog className="w-4 h-4 transition-transform duration-200 group-hover:rotate-45" />
              Show Controls
            </>
          )}
        </button>

        {/* Camera Mode Toggle */}
        <button
          onClick={handleCameraModeChange}
          className="absolute top-4 right-52 z-20 bg-gray-900 bg-opacity-80 hover:bg-gray-800 hover:bg-opacity-95 text-white px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-2 border border-gray-600 hover:border-gray-500 backdrop-blur-sm transform hover:scale-105 active:scale-95 hover:shadow-xl active:shadow-md group"
        >
          {cameraMode === 'orbit' ? (
            <>
              <FaEye className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              First Person
            </>
          ) : cameraMode === 'firstPerson' ? (
            <>
              <FaPlane className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              Fly Mode
            </>
          ) : (
            <>
              <FaCamera className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              Orbit View
            </>
          )}
        </button>

        {/* Controls Panel */}
        {showControls && (
          <div className="absolute top-20 left-4 z-10 bg-gray-900 bg-opacity-90 backdrop-blur-sm rounded-xl p-6 max-w-sm border border-gray-600">
            <div className="text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <div className="text-gray-300">
                  {getBiomeEmoji(selectedBiome)}
                </div>
                {selectedBiomeData?.displayName}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-300 flex items-center gap-2">
                    <FaDice className="w-4 h-4" />
                    World Seed
                  </label>
                  <input 
                    type="text" 
                    value={seedInput} 
                    onChange={handleSeedInputChange}
                    onKeyDown={handleSeedInputKeyDown}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all"
                    placeholder="Enter seed..."
                  />
                </div>
                
                <button 
                  onClick={handleRegenerateClick}
                  className="w-full py-3 rounded-lg font-semibold transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <FaRocket className="w-4 h-4" />
                  Generate New World
                </button>

                <div className="text-sm text-gray-400 space-y-1 pt-2 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <FaDice className="w-3 h-3" />
                    Current Seed: {selectedSeed}
                  </div>
                  <div>Chunk Size: {CHUNK_SIZE}×{CHUNK_HEIGHT}×{CHUNK_SIZE}</div>
                  <div className="flex items-center gap-2">
                    {cameraMode === 'orbit' ? (
                      <FaCamera className="w-3 h-3" />
                    ) : cameraMode === 'firstPerson' ? (
                      <FaPlane className="w-3 h-3" />
                    ) : (
                      <FaEye className="w-3 h-3" />
                    )}
                    Camera: {cameraMode === 'orbit' ? 'Orbit View' : cameraMode === 'firstPerson' ? 'First Person' : 'Fly Mode'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3D Canvas */}
        <Canvas style={{ background: '#27272a' }}>
          <Suspense fallback={null}>
            <PerspectiveCamera 
              makeDefault 
              position={cameraMode === 'orbit' 
                ? [CHUNK_SIZE * 0.75, CHUNK_HEIGHT * 1.5, CHUNK_SIZE * 0.75]
                : cameraMode === 'firstPerson' ? [0, CHUNK_HEIGHT * 0.3, 0] : [0, CHUNK_HEIGHT * 0.3, 0]
              } 
              fov={75} 
            />
            
            {cameraMode === 'orbit' ? (
              <OrbitControls 
                target={[0, 0, 0]}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
              />
            ) : cameraMode === 'firstPerson' ? (
              <FirstPersonCamera
                movementSpeed={18}
                lookSpeed={0.002}
                jumpHeight={15}
                gravity={35}
                voxelData={terrainData || undefined}
              />
            ) : (
              <FlyControls
                movementSpeed={10}
                rollSpeed={0.5}
                autoForward={false}
                dragToLook={false}
              />
            )}

            {terrainData && (
              <Chunk 
                voxelData={terrainData} 
                hdrPath={currentHdrPath}
              />
            )}
          </Suspense>
        </Canvas>
        
        {/* Camera Mode Instructions */}
        {cameraMode !== 'orbit' && (
          <div 
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-gray-900 bg-opacity-90 text-white px-6 py-3 rounded-lg border border-gray-600 backdrop-blur-sm"
          >
            <div className="text-center text-sm">
              <div className="font-semibold mb-1">
                {cameraMode === 'firstPerson' ? 'First Person Mode' : 'Fly Mode'}
              </div>
              <div className="text-gray-300">
                {cameraMode === 'firstPerson' 
                  ? 'Click to enable mouse look • WASD to move • SPACE to jump • ESC to unlock'
                  : 'WASD to move • QE to go up/down • Mouse to look around'
                }
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
