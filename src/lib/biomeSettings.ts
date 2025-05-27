export interface BeachTreeSettings {
  countMin: number;
  countMax: number;
  minHeight: number;
  maxHeight: number;
  frondRadius: number;
  trunkThickness: number;
  curveFactor: number;
  placementNoiseScale: number;
  placementThreshold: number;
}

export interface BeachRockSettings {
  countMin: number;
  countMax: number;
  sizeMin: number;
  sizeMax: number;
  maxPlacementAttempts: number;
}

export interface BeachGrassSettings {
  densityFactor: number;
  minDistanceFromWater: number;
}

export interface BeachBiomeSettingsType {
  name: string;
  hdrPath: string | null;
  waterLevelFactor: number;
  beachStartLineZFactor: number;
  inlandElevationFactor: number;
  duneVariationFactor: number;
  generalNoiseScale: number;
  trees: BeachTreeSettings;
  rocks: BeachRockSettings;
  beachGrass: BeachGrassSettings;
}

export interface ForestTreeSettings {
  countMin: number;
  countMax: number;
  minHeight: number;
  maxHeight: number;
  trunkThickness: number;
  leafLayersMin: number;
  leafLayersMax: number;
  leafLayerHeight: number;
  baseLeafRadiusMax: number;
  placementNoiseScale: number;
  placementThreshold: number;
  minDistFromOtherTree: number;
  maxPlacementAttempts: number;
  altLeafChance: number;
}

export interface ForestPebbleSettings {
  densityFactor: number;
  maxPebblesPerChunk: number;
  maxYLevel: number;
}

export interface CaveSettings {
  chance: number;
  minHillHeightRequired: number;
  entranceWidth: number;
  entranceHeight: number;
  maxDepth: number;
  floorOffset: number;
}

export interface BorderHillSettings {
  chance: number;
  maxHills: number;
  minRadius: number;
  maxRadius: number;
  minHeight: number;
  maxHeight: number;
  borderProximity: number;
  cave: CaveSettings;
}

export interface StoneVariationSettings {
  lightChance: number;
  darkChance: number;
}

export interface DirtStoneTransitionSettings {
  depth: number;
  mixChance: number;
}

export interface ForestBiomeSettingsType {
  name: string;
  baseHeightFactor: number;
  terrainNoiseScale: number;
  terrainNoiseAmplitude: number;
  voxelTypeId: number;
  surfaceDirtPatchChance: number;
  forestFloorDetailChance: number;
  underSurfaceVoxelTypeId: number;
  dirtLayerDepth: number;
  hdrPath: string | null;
  trees: ForestTreeSettings;
  pebbles: ForestPebbleSettings;
  borderHillSettings: BorderHillSettings;
  stoneVariations: StoneVariationSettings;
  dirtStoneTransition: DirtStoneTransitionSettings;
}

// Define more specific types for Desert and Jungle when their settings are fleshed out
// For now, a placeholder allowing name and other potential common fields
export interface BaseBiomeSettings {
  name: string;
  hdrPath?: string | null; 
  // Add other common properties if any
}

// Mountain biome interfaces
export interface MountainVegetationSettings {
  grassDensityFactor: number; // Chance for grass at lower elevations
  treeDensityFactor: number; // Chance for trees in valleys
  maxTreeElevationFactor: number; // Factor of CHUNK_HEIGHT above which no trees grow
  maxGrassElevationFactor: number; // Factor of CHUNK_HEIGHT above which grass completely disappears
  grassTransitionFactor: number; // Factor of CHUNK_HEIGHT for grass fade transition zone
  dirtMaxElevationFactor: number; // Factor of CHUNK_HEIGHT above which dirt completely disappears
  dirtTransitionFactor: number; // Factor of CHUNK_HEIGHT for dirt fade transition zone
  treeMinHeight: number;
  treeMaxHeight: number;
  treeRadius: number;
}

export interface MountainSnowSettings {
  snowLineFactor: number; // Factor of CHUNK_HEIGHT above which snow appears
  snowThickness: number; // How many layers of snow on peaks
  snowCoverageFactor: number; // Probability of snow at eligible elevations
}

export interface MountainRockSettings {
  boulderChance: number; // Chance for large boulder formations
  boulderMinSize: number;
  boulderMaxSize: number;
  rockFallDensity: number; // Scattered rocks on slopes
  maxBoulders: number;
}

export interface MountainTerrainSettings {
  baseHeightFactor: number; // Base elevation of mountains
  primaryNoiseScale: number; // Large-scale mountain shapes
  primaryNoiseAmplitude: number; // Height variation for main peaks
  secondaryNoiseScale: number; // Medium-scale terrain features
  secondaryNoiseAmplitude: number; // Height variation for secondary features
  detailNoiseScale: number; // Fine surface details
  detailNoiseAmplitude: number; // Small height variations
  valleyDepthFactor: number; // How deep valleys can go below base height
  peakHeightFactor: number; // How high peaks can rise above base height
  lakeSettings: {
    chance: number; // Chance for a lake to appear in the chunk
    minSize: number; // Minimum radius of the lake
    maxSize: number; // Maximum radius of the lake
    depthFactor: number; // How deep the lake can be (factor of CHUNK_HEIGHT)
    waterLevel: number; // Water level relative to lake bottom
  };
}

export interface MountainBiomeSettingsType {
  name: string;
  hdrPath: string | null;
  terrain: MountainTerrainSettings;
  vegetation: MountainVegetationSettings;
  snow: MountainSnowSettings;
  rocks: MountainRockSettings;
}

export type DesertBiomeSettingsType = BaseBiomeSettings;
export type JungleBiomeSettingsType = BaseBiomeSettings;

export const beachBiomeSettings: BeachBiomeSettingsType = {
  name: "Beach",
  hdrPath: '/sunset.hdr', // Added HDR path for the beach biome
  waterLevelFactor: 1/6, // Factor of CHUNK_HEIGHT
  beachStartLineZFactor: 1/2.5, // Factor of CHUNK_SIZE where beach slope begins
  inlandElevationFactor: 1/12, // Added to waterLevel for base inland height (factor of CHUNK_HEIGHT)
  duneVariationFactor: 1/12, // Factor of CHUNK_HEIGHT for dune noise amplitude
  generalNoiseScale: 80, // Was 40
  
  trees: {
    countMin: 1,
    countMax: 2,
    minHeight: 30, // Was 15
    maxHeight: 40, // Was 20
    frondRadius: 10, // Was 5
    trunkThickness: 4, // Was 2
    curveFactor: 0.5, // Much stronger curve factor for visible bending
    placementNoiseScale: 40, // Was 20
    placementThreshold: 0.35,
  },

  rocks: {
    countMin: 4,      // Min number of rock clusters per chunk
    countMax: 8,      // Max number of rock clusters per chunk
    sizeMin: 2,       // Was 1 // Min voxels per rock cluster
    sizeMax: 2,       // Was 1 // Max voxels per rock cluster
    maxPlacementAttempts: 20 // Attempts to find a spot for each cluster
  },

  beachGrass: {
    densityFactor: 0.03, // 3% chance for grass on eligible sand blocks
    minDistanceFromWater: 6 // Was 3 // Grass should be at least this many voxels away from water edge (horizontally)
  },

  // Seashells are removed, so no settings needed here for now
};

export const forestBiomeSettings: ForestBiomeSettingsType = {
  name: "Forest",
  baseHeightFactor: 1/3,      // Average height of the forest floor
  terrainNoiseScale: 60,      // Was 30. Scale for terrain undulation
  terrainNoiseAmplitude: 10,   // Was 5. Max height variation for undulation
  voxelTypeId: 3,             // VOXEL_TYPE_GRASS (main surface type)
  surfaceDirtPatchChance: 0.30, // Chance for a grass block on surface to be a dirt patch (Increased from 0.15)
  forestFloorDetailChance: 0.10, // Chance for a surface block to be a 'forest floor detail' voxel
  underSurfaceVoxelTypeId: 5, // VOXEL_TYPE_DIRT_MEDIUM for soil (Changed from 6 - DIRT_DARK)
  dirtLayerDepth: 10,          // Was 5. Depth of dirt layer below surface
  hdrPath: '/forest.hdr',  // Updated to use the new forest HDR
  trees: { 
    countMin: 30,                // Min number of trees per chunk (Increased from 5)
    countMax: 40,               // Max number of trees per chunk (Increased from 10)
    minHeight: 16,               // Was 8. Min height of a tree trunk
    maxHeight: 30,              // Was 15. Max height of a tree trunk
    trunkThickness: 4,          // Was 2. Thickness of the trunk (e.g., 1x1 or 2x2)
    // For conical leaves, we might define layers or a base radius and taper factor
    leafLayersMin: 3,           // Min number of leaf layers
    leafLayersMax: 5,           // Max number of leaf layers
    leafLayerHeight: 4,         // Was 2. Height of each leaf layer/segment
    baseLeafRadiusMax: 8,       // Was 4. Max radius of the lowest leaf layer
    placementNoiseScale: 40,    // Was 20. Noise scale for tree placement suitability
    placementThreshold: 0.4,    // Threshold for placement noise (higher = fewer, more selective spots)
    minDistFromOtherTree: 10,    // Was 5. Minimum distance between tree bases
    maxPlacementAttempts: 30,   // Attempts to find a spot for each tree
    altLeafChance: 0.3          // Chance for a leaf to be the alternate color
  },
  pebbles: {
    densityFactor: 0.05, // 5% chance for a pebble on an eligible ground block
    maxPebblesPerChunk: 50, // Cap on total pebbles
    maxYLevel: 126 // Was 62. Don't place if too close to chunk top (CHUNK_HEIGHT - 2)
  },
  borderHillSettings: {
    chance: 1,
    maxHills: 1, // Max hills to try and place
    minRadius: 20, // Was 10
    maxRadius: 24, // Was 12
    minHeight: 18, // Was 9
    maxHeight: 26, // Was 13
    borderProximity: 10, // Was 5. How close to the actual border (0 or CHUNK_SIZE-1) the hill center can be
    cave: {
      chance: 1, // 60% chance a qualifying hill gets a cave
      minHillHeightRequired: 10, // Was 5. Hill must be at least this tall (actual height, not setting)
      entranceWidth: 10, // Was 5
      entranceHeight: 10, // Was 5
      maxDepth: 60, // Was 30. How far the cave goes into the hill
      floorOffset: 2 // Was 1. Cave floor starts 1 voxel above the hill's intersection with original ground
    }
  },
  stoneVariations: {
    lightChance: 0.20, // 20% chance for a stone block to be light stone
    darkChance: 0.20   // 20% chance for a stone block to be dark stone
  },
  dirtStoneTransition: {
    depth: 4,         // Was 2. How many layers at the boundary are affected (e.g., 2 means 2 dirt layers and 2 stone layers)
    mixChance: 0.35   // Chance for a block in this zone to swap to the other material type
  },
  // TODO: Add other forest specific settings later
};

export const mountainBiomeSettings: MountainBiomeSettingsType = {
  name: "Mountain",
  hdrPath: '/mountain.hdr', // Mountain HDR for atmospheric lighting
  
  terrain: {
    baseHeightFactor: 1/12, // Even lower base for more dramatic spikes
    primaryNoiseScale: 60, // Smaller scale for sharper, more frequent peaks
    primaryNoiseAmplitude: 90, // Even larger amplitude for extreme mountains
    secondaryNoiseScale: 25, // Smaller secondary features for sharp ridges
    secondaryNoiseAmplitude: 20, // Sharp secondary variations
    detailNoiseScale: 12, // Fine sharp details
    detailNoiseAmplitude: 6, // Sharp surface texture
    valleyDepthFactor: 1/15, // Extremely deep valleys
    peakHeightFactor: 9/10, // Nearly reach chunk top for dramatic spikes
    lakeSettings: {
      chance: 0.8, // 80% chance for a lake
      minSize: 15, // Minimum radius of 15 blocks
      maxSize: 25, // Maximum radius of 25 blocks
      depthFactor: 1/8, // Lake can be up to 1/8 of chunk height deep
      waterLevel: 4, // Water level is 4 blocks above lake bottom
    }
  },

  vegetation: {
    grassDensityFactor: 0.5, // Higher chance at low elevations
    treeDensityFactor: 0.02, // Even fewer trees
    maxTreeElevationFactor: 1/5, // Trees only in lowest valleys (25% of chunk height)
    maxGrassElevationFactor: 1.5/6, // Grass fades out by 40% of chunk height
    grassTransitionFactor: 1/8, // Transition zone for grass reduction (12.5% of chunk)
    dirtMaxElevationFactor: 1/3, // Dirt reaches up to 60% of chunk height
    dirtTransitionFactor: 1/6, // Transition zone for dirt reduction (16.6% of chunk)
    treeMinHeight: 2, // Even smaller trees
    treeMaxHeight: 4, // Tiny trees for scale
    treeRadius: 1, // Very small pine trees
  },

  snow: {
    snowLineFactor: 1/3, // Snow appears above 2/3 chunk height
    snowThickness: 4, // Up to 4 layers of snow for dramatic peaks
    snowCoverageFactor: 0.8, // 80% snow coverage at eligible elevations
  },

  rocks: {
    boulderChance: 0.02, // 2% chance for boulder formations
    boulderMinSize: 3,
    boulderMaxSize: 8,
    rockFallDensity: 0.05, // 5% chance for scattered rocks on slopes
    maxBoulders: 6, // Max boulder formations per chunk
  },
};

export const desertBiomeSettings: DesertBiomeSettingsType = {
    name: "Desert",
    // TODO: Add desert specific settings later
};

export const jungleBiomeSettings: JungleBiomeSettingsType = {
    name: "Jungle",
    // TODO: Add jungle specific settings later
};

// A way to easily access settings by biome name or type
export const allBiomeSettings: { [key: string]: BeachBiomeSettingsType | ForestBiomeSettingsType | MountainBiomeSettingsType | DesertBiomeSettingsType | JungleBiomeSettingsType } = {
  beach: beachBiomeSettings,
  forest: forestBiomeSettings,
  mountain: mountainBiomeSettings,
  desert: desertBiomeSettings as DesertBiomeSettingsType, // Cast for now
  jungle: jungleBiomeSettings as JungleBiomeSettingsType, // Cast for now
}; 