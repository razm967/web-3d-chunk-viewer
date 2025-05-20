import { generateBeachChunkData } from './terrainGenerators/beachChunk';
import { generateTestPlainChunkData } from './terrainGenerators/testPlainChunk';
import { allBiomeSettings } from './biomeSettings';
import { Voxel } from './chunkUtils';

export interface Biome {
  id: string;
  displayName: string;
  generateChunkData: (seed?: string) => Voxel[];
  settings: any; // Holds settings including hdrPath, voxelTypeId etc.
}

export const biomes: { [key: string]: Biome } = {
  beach: {
    id: 'beach',
    displayName: 'Beach',
    generateChunkData: generateBeachChunkData,
    settings: allBiomeSettings.beach,
  },
  testPlain: {
    id: 'testPlain',
    displayName: 'Test Plain',
    generateChunkData: generateTestPlainChunkData,
    settings: allBiomeSettings.testPlain,
  },
  // Add other biomes here as they are developed
  // forest: {
  //   id: 'forest',
  //   displayName: 'Forest',
  //   generateChunkData: generateForestChunkData, // (To be created)
  //   settings: allBiomeSettings.forest,
  // },
};

export function getBiomeById(id: string): Biome | undefined {
  return biomes[id];
}

export function getAvailableBiomes(): Biome[] {
  return Object.values(biomes);
}

/**
 * Generates a biome-specific seed.
 * @param biomeId The unique ID of the biome (e.g., "beach").
 * @param userSeed The seed string provided by the user.
 * @returns A combined seed string (e.g., "beach_myseed123").
 */
export function generateBiomeSpecificSeed(biomeId: string, userSeed: string): string {
  if (!userSeed) return `${biomeId}_${Math.random().toString(36).substring(7)}`;
  return `${biomeId}_${userSeed}`;
} 