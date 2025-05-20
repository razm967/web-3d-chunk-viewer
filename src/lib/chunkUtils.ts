// This file will contain functions for generating and managing chunk data.

import { createNoise2D } from 'simplex-noise';
import Alea from 'alea'; // Import Alea

export const CHUNK_SIZE = 64;
export const CHUNK_HEIGHT = 64; // Can be different from width/depth if needed, but for now same.

// Voxel Types
export const VOXEL_TYPE_EMPTY = 0;
export const VOXEL_TYPE_MUSHROOM_CAP = 1; 
export const VOXEL_TYPE_MUSHROOM_STEM = 2;
export const VOXEL_TYPE_GRASS = 3;         // Green
export const VOXEL_TYPE_DIRT_LIGHT = 4;    // Light Brown
export const VOXEL_TYPE_DIRT_MEDIUM = 5;   // Medium Brown
export const VOXEL_TYPE_DIRT_DARK = 6;     // Dark Brown
// Removed VOXEL_TYPE_DIRT as it's now split into shades

// New Voxel Types for Beach Biome
export const VOXEL_TYPE_SAND = 7;
export const VOXEL_TYPE_SANDSTONE = 8;
export const VOXEL_TYPE_WATER = 9;
export const VOXEL_TYPE_PALM_TRUNK = 10;
export const VOXEL_TYPE_PALM_FROND = 11;
export const VOXEL_TYPE_SAND_LIGHT = 12;
export const VOXEL_TYPE_SAND_DARK = 13;
export const VOXEL_TYPE_ROCK = 14;
export const VOXEL_TYPE_BEACH_GRASS = 15;

// New Voxel Types for Forest Biome
export const VOXEL_TYPE_FOREST_TRUNK = 16; // For straight, conifer-like trunks
export const VOXEL_TYPE_FOREST_LEAVES = 17; // For conifer-like foliage
export const VOXEL_TYPE_FOREST_FLOOR_DETAIL = 18; // For patches of fallen leaves, darker soil, etc.
export const VOXEL_TYPE_PEBBLE = 19; // For small stones/pebbles on the ground
export const VOXEL_TYPE_STONE = 20; // For a solid stone base layer
export const VOXEL_TYPE_STONE_LIGHT = 21; // Lighter variation of stone
export const VOXEL_TYPE_STONE_DARK = 22;  // Darker variation of stone

export type Voxel = number; 

// Helper to get 2D noise normalized to 0-1 range
// Now takes noiseFunc as an argument
function getNormalizedNoise(noiseFunc: (x: number, y: number) => number, x: number, z: number, scale: number, amplitude: number): number {
  return (noiseFunc(x / scale, z / scale) + 1) / 2 * amplitude;
}

// Modified to accept a seed
export function generateTerrainChunkData(seed?: string): Voxel[] {
  const prng = seed ? Alea(seed) : Alea(Math.random().toString()); // Use seed or random if none provided
  const noise2D = createNoise2D(prng); // Create noise function with seeded PRNG

  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(VOXEL_TYPE_EMPTY);
  const baseTerrainHeight = Math.floor(CHUNK_HEIGHT / 3); // Average height of terrain
  const noiseScale = 25; // How zoomed in/out the noise is. Larger = smoother features.
  const noiseAmplitude = CHUNK_HEIGHT / 4; // Max height variation due to noise

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      // Pass the created noise2D function to getNormalizedNoise
      const surfaceNoise = getNormalizedNoise(noise2D, x, z, noiseScale, noiseAmplitude);
      const surfaceHeight = Math.floor(baseTerrainHeight + surfaceNoise);

      // Ensure surfaceHeight is within chunk bounds
      const actualSurfaceY = Math.max(0, Math.min(CHUNK_HEIGHT - 1, surfaceHeight));

      // Place grass block at the surface
      if (actualSurfaceY >= 0) {
        const grassIndex = x + (actualSurfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        data[grassIndex] = VOXEL_TYPE_GRASS;
      }

      // Place dirt blocks below grass down to y=0
      for (let y = actualSurfaceY - 1; y >= 0; y--) {
        const dirtIndex = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        const depth = actualSurfaceY - y;
        
        // Determine dirt shade based on depth from the grass block
        // This is a simple distribution, can be tuned
        if (depth <= 2) { // Top layer of dirt (closest to grass)
          data[dirtIndex] = VOXEL_TYPE_DIRT_LIGHT;
        } else if (depth <= 5) { // Middle layer
          data[dirtIndex] = VOXEL_TYPE_DIRT_MEDIUM;
        } else { // Deepest layer
          data[dirtIndex] = VOXEL_TYPE_DIRT_DARK;
        }
      }
    }
  }
  return Array.from(data);
}

// Mushroom generation (can be kept or removed if focusing on terrain now)
export function generateMushroomChunkData(): Voxel[] {
  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(VOXEL_TYPE_EMPTY);
  const center = CHUNK_SIZE / 2;
  const stemRadius = 2;
  const stemHeight = 10;
  const stemBaseY = Math.floor(CHUNK_HEIGHT / 3); // Place mushroom on average terrain height for context
  const capRadius = 6;
  const capCenterY = stemBaseY + stemHeight + 2;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        const dxStem = x - center;
        const dzStem = z - center;
        if (dxStem * dxStem + dzStem * dzStem <= stemRadius * stemRadius && 
            y >= stemBaseY && y < stemBaseY + stemHeight) {
          data[index] = VOXEL_TYPE_MUSHROOM_STEM;
        }
        const dxCap = x - center;
        const dyCap = y - capCenterY;
        const dzCap = z - center;
        if (dxCap * dxCap + dyCap * dyCap + dzCap * dzCap <= capRadius * capRadius) {
          if (y >= capCenterY -1 && y < capCenterY + capRadius) {
            if (data[index] === VOXEL_TYPE_EMPTY || data[index] === VOXEL_TYPE_MUSHROOM_CAP) {
                 data[index] = VOXEL_TYPE_MUSHROOM_CAP;
            }
          }
        }
      }
    }
  }
  return Array.from(data);
}

export function generateFlatChunkData(): Voxel[] {
  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(VOXEL_TYPE_EMPTY);
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_HEIGHT / 3; y++) { // Fill bottom third with dark dirt
        const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        data[index] = VOXEL_TYPE_DIRT_DARK;
      }
    }
  }
  return Array.from(data);
}

export function getVoxel(data: Voxel[], x: number, y: number, z: number): Voxel {
  if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
    return VOXEL_TYPE_EMPTY;
  }
  const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
  return data[index];
}

// We can add Perlin noise generation here later. 