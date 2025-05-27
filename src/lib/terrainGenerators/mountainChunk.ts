import { createNoise2D } from 'simplex-noise';
import Alea from 'alea';
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  Voxel,
  VOXEL_TYPE_EMPTY,
  VOXEL_TYPE_GRASS,
  VOXEL_TYPE_DIRT_MEDIUM,
  VOXEL_TYPE_STONE,
  VOXEL_TYPE_STONE_LIGHT,
  VOXEL_TYPE_STONE_DARK,
  VOXEL_TYPE_FOREST_TRUNK,
  VOXEL_TYPE_FOREST_LEAVES,
  VOXEL_TYPE_ROCK,
  VOXEL_TYPE_SNOW
} from '../chunkUtils';
import { mountainBiomeSettings as settings } from '../biomeSettings';

// Helper to get 2D noise normalized to 0-1 range
function getNormalizedNoise(noiseFunc: (x: number, y: number) => number, x: number, z: number, scale: number, amplitude: number): number {
  return (noiseFunc(x / scale, z / scale) + 1) / 2 * amplitude;
}

// Helper to calculate slope steepness for placing vegetation and rocks
function calculateSlope(heightMap: number[][], x: number, z: number): number {
  if (x === 0 || x === CHUNK_SIZE - 1 || z === 0 || z === CHUNK_SIZE - 1) return 1; // Assume steep at edges
  
  const currentHeight = heightMap[x][z];
  const neighbors = [
    heightMap[x-1][z], heightMap[x+1][z],
    heightMap[x][z-1], heightMap[x][z+1]
  ];
  
  let maxDifference = 0;
  for (const neighborHeight of neighbors) {
    maxDifference = Math.max(maxDifference, Math.abs(currentHeight - neighborHeight));
  }
  
  return maxDifference / 10; // Normalize slope factor
}

export function generateMountainChunkData(seed?: string): Voxel[] {
  const prng = seed ? Alea(seed) : Alea(Math.random().toString());
  
  // Multiple noise layers for terrain complexity
  const primaryNoise = createNoise2D(Alea(seed + "primary"));
  const secondaryNoise = createNoise2D(Alea(seed + "secondary"));
  const detailNoise = createNoise2D(Alea(seed + "detail"));
  const vegetationNoise = createNoise2D(Alea(seed + "vegetation"));
  const rockNoise = createNoise2D(Alea(seed + "rocks"));

  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(VOXEL_TYPE_EMPTY);
  
  // Calculate terrain heights using multiple noise layers
  const heightMap: number[][] = [];
  const baseHeight = Math.floor(CHUNK_HEIGHT * settings.terrain.baseHeightFactor);
  const valleyDepth = Math.floor(CHUNK_HEIGHT * settings.terrain.valleyDepthFactor);
  const peakHeight = Math.floor(CHUNK_HEIGHT * settings.terrain.peakHeightFactor);
  
  for (let x = 0; x < CHUNK_SIZE; x++) {
    heightMap[x] = [];
    for (let z = 0; z < CHUNK_SIZE; z++) {
      // Large-scale mountain shapes
      const primaryHeight = getNormalizedNoise(
        primaryNoise, x, z,
        settings.terrain.primaryNoiseScale,
        settings.terrain.primaryNoiseAmplitude
      );
      
      // Medium-scale terrain features
      const secondaryHeight = getNormalizedNoise(
        secondaryNoise, x, z,
        settings.terrain.secondaryNoiseScale,
        settings.terrain.secondaryNoiseAmplitude
      );
      
      // Fine surface details
      const detailHeight = getNormalizedNoise(
        detailNoise, x, z,
        settings.terrain.detailNoiseScale,
        settings.terrain.detailNoiseAmplitude
      );
      
      // Create extremely sharp and spiky mountain peaks
      const combinedNoise = (primaryHeight * 0.8) + (secondaryHeight * 0.15) + (detailHeight * 0.05);
      
      // Apply multiple transformations for ultra-sharp spikes
      let normalizedNoise = combinedNoise / settings.terrain.primaryNoiseAmplitude;
      
      // Create sharp spikes using power function with high exponent
      const spikeNoise = Math.pow(normalizedNoise, 2.5) * settings.terrain.primaryNoiseAmplitude;
      
      // Add sharp ridges using absolute value function for jagged edges
      const ridgeNoise = Math.abs(secondaryHeight - settings.terrain.secondaryNoiseAmplitude/2) * 2;
      
      // Combine for ultra-sharp terrain
      const totalHeight = baseHeight + spikeNoise + (ridgeNoise * 0.3);
      
      // Clamp to valley and peak limits but allow full range
      heightMap[x][z] = Math.floor(Math.max(valleyDepth, Math.min(peakHeight, totalHeight)));
    }
  }
  
  // Generate base terrain
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const surfaceHeight = heightMap[x][z];
      
      for (let y = 0; y <= surfaceHeight && y < CHUNK_HEIGHT; y++) {
        const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        const depthFromSurface = surfaceHeight - y;
        
        if (depthFromSurface === 0) {
          // Surface layer - determine material based on elevation with gradual transitions
          const elevationFactor = y / CHUNK_HEIGHT;
          
          // Calculate grass transition (starts reducing before max elevation)
          const grassTransitionStart = settings.vegetation.maxGrassElevationFactor - settings.vegetation.grassTransitionFactor;
          let grassChance = 0;
          if (elevationFactor <= grassTransitionStart) {
            grassChance = settings.vegetation.grassDensityFactor;
          } else if (elevationFactor < settings.vegetation.maxGrassElevationFactor) {
            // Gradual reduction in grass transition zone
            const transitionProgress = (elevationFactor - grassTransitionStart) / settings.vegetation.grassTransitionFactor;
            grassChance = settings.vegetation.grassDensityFactor * (1 - transitionProgress);
          }
          
          // Calculate dirt transition
          const dirtTransitionStart = settings.vegetation.dirtMaxElevationFactor - settings.vegetation.dirtTransitionFactor;
          let dirtChance = 0;
          if (elevationFactor <= dirtTransitionStart) {
            dirtChance = 0.4; // Base dirt chance at low elevations
          } else if (elevationFactor < settings.vegetation.dirtMaxElevationFactor) {
            // Gradual reduction in dirt transition zone
            const transitionProgress = (elevationFactor - dirtTransitionStart) / settings.vegetation.dirtTransitionFactor;
            dirtChance = 0.4 * (1 - transitionProgress);
          }
          
          if (elevationFactor >= settings.snow.snowLineFactor) {
            // High elevation - snow or rock
            if (prng() < settings.snow.snowCoverageFactor) {
              data[index] = VOXEL_TYPE_SNOW;
            } else {
              // Exposed rock at peaks - more variety
              const rockRand = prng();
              if (rockRand < 0.4) {
                data[index] = VOXEL_TYPE_STONE;
              } else if (rockRand < 0.7) {
                data[index] = VOXEL_TYPE_STONE_LIGHT;
              } else {
                data[index] = VOXEL_TYPE_STONE_DARK;
              }
            }
          } else {
            // Determine surface material based on calculated chances
            const surfaceRand = prng();
            
            if (surfaceRand < grassChance) {
              data[index] = VOXEL_TYPE_GRASS;
            } else if (surfaceRand < grassChance + dirtChance) {
              data[index] = VOXEL_TYPE_DIRT_MEDIUM;
            } else {
              // Stone becomes dominant at higher elevations
              const rockRand = prng();
              if (rockRand < 0.5) {
                data[index] = VOXEL_TYPE_STONE;
              } else if (rockRand < 0.75) {
                data[index] = VOXEL_TYPE_STONE_LIGHT;
              } else {
                data[index] = VOXEL_TYPE_STONE_DARK;
              }
            }
          }
        } else if (depthFromSurface <= 3) {
          // Shallow subsurface - dirt or stone based on elevation with transitions
          const elevationFactor = y / CHUNK_HEIGHT;
          
          // Calculate dirt presence in subsurface with same transition logic
          const dirtTransitionStart = settings.vegetation.dirtMaxElevationFactor - settings.vegetation.dirtTransitionFactor;
          let subsurfaceDirtChance = 0;
          
          if (elevationFactor <= dirtTransitionStart) {
            subsurfaceDirtChance = 0.8; // High dirt chance in subsurface at low elevations
          } else if (elevationFactor < settings.vegetation.dirtMaxElevationFactor) {
            // Gradual reduction in dirt transition zone
            const transitionProgress = (elevationFactor - dirtTransitionStart) / settings.vegetation.dirtTransitionFactor;
            subsurfaceDirtChance = 0.8 * (1 - transitionProgress);
          }
          
          if (prng() < subsurfaceDirtChance) {
            data[index] = VOXEL_TYPE_DIRT_MEDIUM;
          } else {
            // Stone subsurface
            const rockRand = prng();
            if (rockRand < 0.5) {
              data[index] = VOXEL_TYPE_STONE;
            } else if (rockRand < 0.75) {
              data[index] = VOXEL_TYPE_STONE_LIGHT;
            } else {
              data[index] = VOXEL_TYPE_STONE_DARK;
            }
          }
        } else {
          // Deep subsurface - mostly stone
          const stoneRand = prng();
          if (stoneRand < 0.6) {
            data[index] = VOXEL_TYPE_STONE;
          } else if (stoneRand < 0.8) {
            data[index] = VOXEL_TYPE_STONE_LIGHT;
          } else {
            data[index] = VOXEL_TYPE_STONE_DARK;
          }
        }
      }
    }
  }
  
  // Add additional snow layers on peaks
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const surfaceHeight = heightMap[x][z];
      const elevationFactor = surfaceHeight / CHUNK_HEIGHT;
      
      if (elevationFactor >= settings.snow.snowLineFactor) {
        const snowLayers = Math.floor(prng() * settings.snow.snowThickness) + 1;
        
        for (let layer = 1; layer <= snowLayers; layer++) {
          const snowY = surfaceHeight + layer;
          if (snowY < CHUNK_HEIGHT && prng() < settings.snow.snowCoverageFactor * (1 - layer * 0.2)) {
            const snowIndex = x + (snowY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
            if (data[snowIndex] === VOXEL_TYPE_EMPTY) {
              data[snowIndex] = VOXEL_TYPE_SNOW;
            }
          }
        }
      }
    }
  }
  
  // Generate mountain pine trees in valleys and lower slopes
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const surfaceHeight = heightMap[x][z];
      const elevationFactor = surfaceHeight / CHUNK_HEIGHT;
      const slope = calculateSlope(heightMap, x, z);
      
      // Trees only at lower elevations, gentle slopes, and with vegetation noise
      if (elevationFactor <= settings.vegetation.maxTreeElevationFactor && 
          slope < 0.3 && 
          prng() < settings.vegetation.treeDensityFactor) {
        
        const vegetationValue = (vegetationNoise(x / 15, z / 15) + 1) / 2;
        if (vegetationValue > 0.6) { // Higher threshold for sparser tree placement
          // Generate tiny mountain pine tree
          const treeHeight = settings.vegetation.treeMinHeight + 
                           Math.floor(prng() * (settings.vegetation.treeMaxHeight - settings.vegetation.treeMinHeight));
          
          // Place single trunk block
          const trunkY = surfaceHeight + 1;
          if (trunkY < CHUNK_HEIGHT) {
            const trunkIndex = x + (trunkY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
            if (data[trunkIndex] === VOXEL_TYPE_EMPTY) {
              data[trunkIndex] = VOXEL_TYPE_FOREST_TRUNK;
            }
          }
          
          // Place minimal foliage for scale-appropriate tiny trees
          if (treeHeight >= 3) {
            for (let h = 2; h <= treeHeight; h++) {
              const leafY = surfaceHeight + h;
              if (leafY < CHUNK_HEIGHT) {
                // Very small conical shape - just a few blocks
                const radius = Math.max(0, settings.vegetation.treeRadius - (h - 2));
                
                for (let dx = -radius; dx <= radius; dx++) {
                  for (let dz = -radius; dz <= radius; dz++) {
                    if (dx === 0 && dz === 0) continue; // Skip center (trunk)
                    
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    if (distance <= radius && prng() < 0.6) {
                      const leafX = x + dx;
                      const leafZ = z + dz;
                      
                      if (leafX >= 0 && leafX < CHUNK_SIZE && leafZ >= 0 && leafZ < CHUNK_SIZE) {
                        const leafIndex = leafX + (leafY * CHUNK_SIZE) + (leafZ * CHUNK_SIZE * CHUNK_HEIGHT);
                        if (data[leafIndex] === VOXEL_TYPE_EMPTY) {
                          data[leafIndex] = VOXEL_TYPE_FOREST_LEAVES;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Generate boulder formations and scattered rocks
  let boulderCount = 0;
  const maxBoulders = settings.rocks.maxBoulders;
  
  for (let x = 0; x < CHUNK_SIZE && boulderCount < maxBoulders; x += 8) {
    for (let z = 0; z < CHUNK_SIZE && boulderCount < maxBoulders; z += 8) {
      if (prng() < settings.rocks.boulderChance) {
        const boulderX = x + Math.floor(prng() * 8);
        const boulderZ = z + Math.floor(prng() * 8);
        
        if (boulderX < CHUNK_SIZE && boulderZ < CHUNK_SIZE) {
          const surfaceHeight = heightMap[boulderX][boulderZ];
          const slope = calculateSlope(heightMap, boulderX, boulderZ);
          
          // Boulders on moderate slopes
          if (slope > 0.1 && slope < 0.6) {
            const boulderSize = settings.rocks.boulderMinSize + 
                              Math.floor(prng() * (settings.rocks.boulderMaxSize - settings.rocks.boulderMinSize));
            
            // Create boulder formation
            for (let dx = 0; dx < boulderSize; dx++) {
              for (let dy = 0; dy < Math.max(1, boulderSize - 1); dy++) {
                for (let dz = 0; dz < boulderSize; dz++) {
                  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                  if (distance < boulderSize / 2 && prng() < 0.8) {
                    const rockX = boulderX + dx - Math.floor(boulderSize / 2);
                    const rockY = surfaceHeight + dy + 1;
                    const rockZ = boulderZ + dz - Math.floor(boulderSize / 2);
                    
                    if (rockX >= 0 && rockX < CHUNK_SIZE && 
                        rockY < CHUNK_HEIGHT && 
                        rockZ >= 0 && rockZ < CHUNK_SIZE) {
                      const rockIndex = rockX + (rockY * CHUNK_SIZE) + (rockZ * CHUNK_SIZE * CHUNK_HEIGHT);
                      if (data[rockIndex] === VOXEL_TYPE_EMPTY) {
                        data[rockIndex] = VOXEL_TYPE_ROCK;
                      }
                    }
                  }
                }
              }
            }
            boulderCount++;
          }
        }
      }
    }
  }
  
  // Add scattered rocks on slopes (rockfall simulation)
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const surfaceHeight = heightMap[x][z];
      const slope = calculateSlope(heightMap, x, z);
      
      // Scattered rocks on steep slopes
      if (slope > 0.3 && prng() < settings.rocks.rockFallDensity) {
        const rockValue = (rockNoise(x / 15, z / 15) + 1) / 2;
        if (rockValue > 0.6) {
          const rockY = surfaceHeight + 1;
          if (rockY < CHUNK_HEIGHT) {
            const rockIndex = x + (rockY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
            if (data[rockIndex] === VOXEL_TYPE_EMPTY) {
              data[rockIndex] = VOXEL_TYPE_ROCK;
            }
          }
        }
      }
    }
  }
  
  return Array.from(data);
} 