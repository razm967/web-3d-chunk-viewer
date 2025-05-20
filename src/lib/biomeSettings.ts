export const beachBiomeSettings = {
  name: "Beach",
  hdrPath: '/sunset.hdr', // Added HDR path for the beach biome
  waterLevelFactor: 1/6, // Factor of CHUNK_HEIGHT
  beachStartLineZFactor: 1/2.5, // Factor of CHUNK_SIZE where beach slope begins
  inlandElevationFactor: 1/12, // Added to waterLevel for base inland height (factor of CHUNK_HEIGHT)
  duneVariationFactor: 1/12, // Factor of CHUNK_HEIGHT for dune noise amplitude
  generalNoiseScale: 40,
  
  trees: {
    countMin: 1,
    countMax: 2,
    minHeight: 15,
    maxHeight: 20,
    frondRadius: 5,
    trunkThickness: 2,
    curveFactor: 0.15,
    placementNoiseScale: 20,
    placementThreshold: 0.35,
  },

  rocks: {
    countMin: 4,      // Min number of rock clusters per chunk
    countMax: 8,      // Max number of rock clusters per chunk
    sizeMin: 1,       // Min voxels per rock cluster
    sizeMax: 1,       // Max voxels per rock cluster
    maxPlacementAttempts: 20 // Attempts to find a spot for each cluster
  },

  beachGrass: {
    densityFactor: 0.03, // 3% chance for grass on eligible sand blocks
    minDistanceFromWater: 3 // Grass should be at least this many voxels away from water edge (horizontally)
  },

  // Seashells are removed, so no settings needed here for now
};

export const forestBiomeSettings = {
  name: "Forest",
  baseHeightFactor: 1/3,      // Average height of the forest floor
  terrainNoiseScale: 30,      // Scale for terrain undulation
  terrainNoiseAmplitude: 5,   // Max height variation for undulation
  voxelTypeId: 3,             // VOXEL_TYPE_GRASS (main surface type)
  surfaceDirtPatchChance: 0.30, // Chance for a grass block on surface to be a dirt patch (Increased from 0.15)
  forestFloorDetailChance: 0.10, // Chance for a surface block to be a 'forest floor detail' voxel
  underSurfaceVoxelTypeId: 5, // VOXEL_TYPE_DIRT_MEDIUM for soil (Changed from 6 - DIRT_DARK)
  dirtLayerDepth: 5,          // Depth of dirt layer below surface
  hdrPath: '/forest.hdr',  // Updated to use the new forest HDR
  trees: { 
    countMin: 30,                // Min number of trees per chunk (Increased from 5)
    countMax: 40,               // Max number of trees per chunk (Increased from 10)
    minHeight: 8,               // Min height of a tree trunk
    maxHeight: 15,              // Max height of a tree trunk
    trunkThickness: 2,          // Thickness of the trunk (e.g., 1x1 or 2x2)
    // For conical leaves, we might define layers or a base radius and taper factor
    leafLayersMin: 3,           // Min number of leaf layers
    leafLayersMax: 5,           // Max number of leaf layers
    leafLayerHeight: 2,         // Height of each leaf layer/segment
    baseLeafRadiusMax: 4,       // Max radius of the lowest leaf layer
    placementNoiseScale: 20,    // Noise scale for tree placement suitability
    placementThreshold: 0.4,    // Threshold for placement noise (higher = fewer, more selective spots)
    minDistFromOtherTree: 5,    // Minimum distance between tree bases
    maxPlacementAttempts: 30,   // Attempts to find a spot for each tree
    altLeafChance: 0.3          // Chance for a leaf to be the alternate color
  },
  pebbles: {
    densityFactor: 0.05, // 5% chance for a pebble on an eligible ground block
    maxPebblesPerChunk: 50, // Cap on total pebbles
    maxYLevel: 62 // Don't place if too close to chunk top (assuming CHUNK_HEIGHT = 64)
  },
  borderHillSettings: {
    chance: 1,
    maxHills: 1, // Max hills to try and place
    minRadius: 10,
    maxRadius: 12,
    minHeight: 9,
    maxHeight: 13,
    borderProximity: 5, // How close to the actual border (0 or CHUNK_SIZE-1) the hill center can be
    cave: {
      chance: 1, // 60% chance a qualifying hill gets a cave
      minHillHeightRequired: 5, // Hill must be at least this tall (actual height, not setting)
      entranceWidth: 5,
      entranceHeight: 5,
      maxDepth: 30, // How far the cave goes into the hill
      floorOffset: 1 // Cave floor starts 1 voxel above the hill's intersection with original ground
    }
  },
  stoneVariations: {
    lightChance: 0.20, // 20% chance for a stone block to be light stone
    darkChance: 0.20   // 20% chance for a stone block to be dark stone
  },
  dirtStoneTransition: {
    depth: 2,         // How many layers at the boundary are affected (e.g., 2 means 2 dirt layers and 2 stone layers)
    mixChance: 0.35   // Chance for a block in this zone to swap to the other material type
  },
  // TODO: Add other forest specific settings later
};

export const desertBiomeSettings = {
    name: "Desert",
    // TODO: Add desert specific settings later
};

export const jungleBiomeSettings = {
    name: "Jungle",
    // TODO: Add jungle specific settings later
};

// A way to easily access settings by biome name or type
export const allBiomeSettings: { [key: string]: any } = {
  beach: beachBiomeSettings,
  forest: forestBiomeSettings,
  desert: desertBiomeSettings,
  jungle: jungleBiomeSettings,
}; 