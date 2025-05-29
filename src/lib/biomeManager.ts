import { generateBeachChunkData } from './terrainGenerators/beachChunk';
import { generateForestChunkData } from './terrainGenerators/forestChunk';
import { generateMountainChunkData } from './terrainGenerators/mountainChunk';
import { generateCrystalCaveChunkData } from './terrainGenerators/crystalCaveChunk';
import { 
    allBiomeSettings,
    BeachBiomeSettingsType,
    ForestBiomeSettingsType,
    MountainBiomeSettingsType,
    DesertBiomeSettingsType,
    JungleBiomeSettingsType,
    CrystalCaveBiomeSettingsType
} from './biomeSettings';
import { Voxel } from './chunkUtils';

export type AnyBiomeSettingsType = BeachBiomeSettingsType | ForestBiomeSettingsType | MountainBiomeSettingsType | DesertBiomeSettingsType | JungleBiomeSettingsType | CrystalCaveBiomeSettingsType;

export interface Biome {
  id: string;
  displayName: string;
  generateChunkData: (seed?: string) => Voxel[];
  settings: AnyBiomeSettingsType; // Updated from any
}

export const biomes: { [key: string]: Biome } = {
  beach: {
    id: 'beach',
    displayName: 'Beach',
    generateChunkData: generateBeachChunkData,
    settings: allBiomeSettings.beach,
  },
  forest: {
    id: 'forest',
    displayName: 'Forest',
    generateChunkData: generateForestChunkData,
    settings: allBiomeSettings.forest,
  },
  mountain: {
    id: 'mountain',
    displayName: 'Mountain',
    generateChunkData: generateMountainChunkData,
    settings: allBiomeSettings.mountain,
  },
  crystalCave: {
    id: 'crystalCave',
    displayName: 'Crystal Cave',
    generateChunkData: generateCrystalCaveChunkData,
    settings: allBiomeSettings.crystalCave,
  },
  // Add other biomes here as they are developed
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