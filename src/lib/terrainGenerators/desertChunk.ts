import { createNoise2D } from 'simplex-noise';
import Alea from 'alea';
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  Voxel,
  VOXEL_TYPE_EMPTY,
  VOXEL_TYPE_SAND,
  VOXEL_TYPE_SAND_LIGHT,
  VOXEL_TYPE_SAND_DARK,
  VOXEL_TYPE_FOREST_LEAVES,
  VOXEL_TYPE_WATER,
} from '../chunkUtils';
import { desertBiomeSettings } from '../biomeSettings';

export function generateDesertChunkData(seed?: string): Voxel[] {
  const prng = seed ? Alea(seed) : Alea(Math.random().toString());
  const noise2D = createNoise2D(prng);
  
  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(VOXEL_TYPE_EMPTY);
  
  // Generate base terrain with dunes
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      // Generate dune height using multiple noise layers
      const duneNoise = (noise2D(
        x / desertBiomeSettings.dunes.noiseScale, 
        z / desertBiomeSettings.dunes.noiseScale
      ) + 1) / 2;
      
      // Create ridge-like dunes
      const ridgeValue = Math.abs(duneNoise - desertBiomeSettings.dunes.ridgeOffset) * 2;
      const duneHeight = Math.floor(
        desertBiomeSettings.baseHeight + 
        ridgeValue * desertBiomeSettings.dunes.amplitude
      );
      
      // Ensure height is within bounds
      const actualHeight = Math.max(0, Math.min(CHUNK_HEIGHT - 1, duneHeight));
      
      // Fill with sand from bottom to dune height
      for (let y = 0; y <= actualHeight; y++) {
        const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        
        // Add sand variations
        if (prng() < desertBiomeSettings.sandVariationChance) {
          data[index] = prng() < 0.5 ? VOXEL_TYPE_SAND_LIGHT : VOXEL_TYPE_SAND_DARK;
        } else {
          data[index] = VOXEL_TYPE_SAND;
        }
      }
    }
  }
  
  // Add oasis
  const oasisCenterX = CHUNK_SIZE / 2 + (prng() * 20 - 10);
  const oasisCenterZ = CHUNK_SIZE / 2 + (prng() * 20 - 10);
  const oasisRadius = 8 + prng() * 4;
  const oasisDepth = 4;

  // Create oasis depression and water
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const dx = x - oasisCenterX;
      const dz = z - oasisCenterZ;
      const distanceToCenter = Math.sqrt(dx * dx + dz * dz);
      
      if (distanceToCenter < oasisRadius) {
        // Find current surface height
        let surfaceY = CHUNK_HEIGHT - 1;
        while (surfaceY > 0 && data[x + (surfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT)] === VOXEL_TYPE_EMPTY) {
          surfaceY--;
        }
        
        // Create depression
        const depthFactor = 1 - (distanceToCenter / oasisRadius);
        const depression = Math.floor(oasisDepth * depthFactor);
        
        // Clear sand above water level
        for (let y = surfaceY; y > surfaceY - depression - 2; y--) {
          const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
          if (y >= 0) {
            data[index] = VOXEL_TYPE_EMPTY;
          }
        }
        
        // Add water
        const waterLevel = surfaceY - depression;
        if (waterLevel >= 0) {
          const waterIndex = x + (waterLevel * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
          data[waterIndex] = VOXEL_TYPE_WATER;
        }
      }
    }
  }
  
  // Add cacti
  let cactiPlaced = 0;
  let attempts = 0;
  const maxCactiAttempts = desertBiomeSettings.cacti.maxCactiPerChunk * 2;
  const placedCactiPositions: [number, number][] = [];
  
  while (cactiPlaced < desertBiomeSettings.cacti.maxCactiPerChunk && attempts < maxCactiAttempts) {
    attempts++;
    
    if (prng() < desertBiomeSettings.cacti.chance) {
      const x = Math.floor(prng() * CHUNK_SIZE);
      const z = Math.floor(prng() * CHUNK_SIZE);
      
      // Don't place cacti too close to oasis
      const dx = x - oasisCenterX;
      const dz = z - oasisCenterZ;
      const distanceToOasis = Math.sqrt(dx * dx + dz * dz);
      
      if (distanceToOasis > oasisRadius + 3) {
        // Check minimum distance from other cacti
        let tooClose = false;
        for (const [cx, cz] of placedCactiPositions) {
          const distance = Math.sqrt((x - cx) * (x - cx) + (z - cz) * (z - cz));
          if (distance < desertBiomeSettings.cacti.minDistanceBetween) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          // Find surface height
          let surfaceY = CHUNK_HEIGHT - 1;
          while (surfaceY > 0 && data[x + (surfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT)] === VOXEL_TYPE_EMPTY) {
            surfaceY--;
          }
          
          if (surfaceY > 0) {
            // Generate cactus
            const height = Math.floor(
              desertBiomeSettings.cacti.minHeight + 
              prng() * (desertBiomeSettings.cacti.maxHeight - desertBiomeSettings.cacti.minHeight)
            );
            
            // Add main trunk
            for (let y = 1; y <= height; y++) {
              const index = x + ((surfaceY + y) * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
              if (surfaceY + y < CHUNK_HEIGHT) {
                data[index] = VOXEL_TYPE_FOREST_LEAVES;
              }
            }
            
            // Add arms at random heights
            const armHeight = Math.floor(height * 0.6);
            if (armHeight > 3) {
              const armY = surfaceY + armHeight;
              if (armY < CHUNK_HEIGHT - 2) {
                // Add horizontal arms in random directions
                const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                for (let i = 0; i < 2; i++) {
                  if (prng() < 0.7) {
                    const [dx, dz] = directions[Math.floor(prng() * directions.length)];
                    const armLength = Math.floor(2 + prng() * 2);
                    
                    for (let j = 1; j <= armLength; j++) {
                      const ax = x + dx * j;
                      const az = z + dz * j;
                      
                      if (ax >= 0 && ax < CHUNK_SIZE && az >= 0 && az < CHUNK_SIZE) {
                        const index = ax + (armY * CHUNK_SIZE) + (az * CHUNK_SIZE * CHUNK_HEIGHT);
                        data[index] = VOXEL_TYPE_FOREST_LEAVES;
                      }
                    }
                  }
                }
              }
            }
            
            placedCactiPositions.push([x, z]);
            cactiPlaced++;
          }
        }
      }
    }
  }
  
  return Array.from(data);
} 