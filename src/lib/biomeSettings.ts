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

export const testPlainBiomeSettings = {
  name: "Test Plain",
  baseHeightFactor: 1/4, // Height of the plain relative to CHUNK_HEIGHT
  voxelTypeId: 2, // VOXEL_TYPE_GRASS (ensure this ID matches your chunkUtils.ts)
  hdrPath: '/test_plain_sky.hdr', // Placeholder HDR path for this biome
};

export const forestBiomeSettings = {
    name: "Forest",
    // TODO: Add forest specific settings later
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
  testPlain: testPlainBiomeSettings,
  forest: forestBiomeSettings,
  desert: desertBiomeSettings,
  jungle: jungleBiomeSettings,
}; 