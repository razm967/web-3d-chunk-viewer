import { createNoise2D } from 'simplex-noise';
import Alea from 'alea';
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  Voxel,
  VOXEL_TYPE_EMPTY,
  VOXEL_TYPE_SAND,
  VOXEL_TYPE_SANDSTONE,
  VOXEL_TYPE_WATER,
  VOXEL_TYPE_PALM_TRUNK,
  VOXEL_TYPE_PALM_FROND,
  VOXEL_TYPE_SAND_LIGHT,
  VOXEL_TYPE_SAND_DARK,
  VOXEL_TYPE_ROCK,
  VOXEL_TYPE_BEACH_GRASS
} from '../chunkUtils'; // Adjusted path assuming it's in a subdirectory
import { beachBiomeSettings as settings } from '../biomeSettings'; // Import settings

// Helper to get 2D noise normalized to 0-1 range
function getNormalizedNoise(noiseFunc: (x: number, y: number) => number, x: number, z: number, scale: number, amplitude: number): number {
  return (noiseFunc(x / scale, z / scale) + 1) / 2 * amplitude;
}

export function generateBeachChunkData(seed?: string): Voxel[] {
  const prng = seed ? Alea(seed) : Alea(Math.random().toString());
  const noise2D = createNoise2D(prng);
  const noise2Dtrees = createNoise2D(Alea(seed + "trees"));
  const noise2DTrunkCurve = createNoise2D(Alea(seed + "trunkCurve"));

  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(VOXEL_TYPE_EMPTY);
  
  // Use settings from biomeSettings.ts
  const waterLevel = Math.floor(CHUNK_HEIGHT * settings.waterLevelFactor);
  
  // --- Customized values for a later starting, lower beach --- 
  const beachStartLineZ_custom = Math.floor(CHUNK_SIZE * -0.08); // Beach slope starts later (60% of Z-depth) // don't change this!!!	
  const targetInlandHeight_custom = waterLevel + 1; // Flatter inland area is very low, just above water level
  // --- End of customized values ---

  // Original values from settings (for reference or if settings are preferred later)
  // const beachStartLineZ_settings = Math.floor(CHUNK_SIZE * settings.beachStartLineZFactor);
  // const inlandElevation_settings = waterLevel + Math.floor(CHUNK_HEIGHT * settings.inlandElevationFactor);

  const duneVariation = CHUNK_HEIGHT * settings.duneVariationFactor;
  const generalNoiseScale = settings.generalNoiseScale;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      let currentSurfaceY;
      const baseNoise = getNormalizedNoise(noise2D, x, z, generalNoiseScale, duneVariation);

      if (z < beachStartLineZ_custom) { // Extended, very low flatter "inland" area
        currentSurfaceY = Math.floor(targetInlandHeight_custom + baseNoise);
      } else { // Beach area sloping towards water
        const beachProgress = (z - beachStartLineZ_custom) / (CHUNK_SIZE - 1 - beachStartLineZ_custom);
        const beachBaseHeight = targetInlandHeight_custom; // Slope starts from this very low height
        const targetBeachHeightAtWater = waterLevel - 1; 
        currentSurfaceY = Math.floor(beachBaseHeight * (1 - beachProgress) + targetBeachHeightAtWater * beachProgress + baseNoise * (1-beachProgress));
        currentSurfaceY = Math.max(waterLevel - 2, currentSurfaceY); // Ensure slope doesn't dip excessively far below water
      }
      currentSurfaceY = Math.min(currentSurfaceY, CHUNK_HEIGHT -1);

      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        if (y < currentSurfaceY) {
          if (y < currentSurfaceY - 3) { 
            data[index] = VOXEL_TYPE_SANDSTONE;
          } else { 
            const rand = prng();
            if (rand < 0.2) {
              data[index] = VOXEL_TYPE_SAND_LIGHT;
            } else if (rand < 0.4) {
              data[index] = VOXEL_TYPE_SAND_DARK;
            } else {
              data[index] = VOXEL_TYPE_SAND;
            }
          }
        } else if (y < waterLevel && z >= beachStartLineZ_custom -5) { // Water placement condition
            if (y < waterLevel && currentSurfaceY <= waterLevel ){
                 data[index] = VOXEL_TYPE_WATER;
            }
        }
      }
      if (currentSurfaceY < CHUNK_HEIGHT && currentSurfaceY >=0) {
        const surfaceIndex = x + (currentSurfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        if (data[surfaceIndex] !== VOXEL_TYPE_WATER) {
          if (data[surfaceIndex] === VOXEL_TYPE_SAND || data[surfaceIndex] === VOXEL_TYPE_EMPTY) {
            const rand = prng();
            if (rand < 0.2) {
              data[surfaceIndex] = VOXEL_TYPE_SAND_LIGHT;
            } else if (rand < 0.4) {
              data[surfaceIndex] = VOXEL_TYPE_SAND_DARK;
            } else {
              data[surfaceIndex] = VOXEL_TYPE_SAND;
            }
          }
        }
      }
    }
  }

  // --- Re-added Palm Tree Generation --- 
  const numberOfTrees = 2; // Generate exactly 2 trees
  const minPalmHeight = settings.trees.minHeight;
  const maxPalmHeight = settings.trees.maxHeight;
  const frondRadius = settings.trees.frondRadius;
  const trunkThickness = settings.trees.trunkThickness;
  const curveFactor = settings.trees.curveFactor;

  for (let i = 0; i < numberOfTrees; i++) {
    let treeBaseX = -1, treeBaseZ = -1, surfaceY = -1;
    let attempts = 0;
    const maxPlacementAttempts = 50; 

    while (attempts < maxPlacementAttempts) {
      const candidateX = Math.floor(prng() * (CHUNK_SIZE - trunkThickness)); 
      const candidateZ = Math.floor(prng() * (CHUNK_SIZE - trunkThickness));

      const treePlacementNoiseVal = (noise2Dtrees(candidateX / settings.trees.placementNoiseScale, candidateZ / settings.trees.placementNoiseScale) + 1) / 2;
      // Forcing 2 trees, so placement threshold is less critical but kept for slight variation possibility
      if (attempts > 5 && treePlacementNoiseVal < settings.trees.placementThreshold && i === 1) { // Make it easier for the second tree if first few attempts fail for it due to noise
          attempts++;
          continue; 
      }

      let tempSurfaceY = -1;
      let allBasePointsOnSand = true;
      for (let dx = 0; dx < trunkThickness; dx++) {
        for (let dz = 0; dz < trunkThickness; dz++) {
          const checkX = candidateX + dx;
          const checkZ = candidateZ + dz;
          if (checkX >= CHUNK_SIZE || checkZ >= CHUNK_SIZE) {
            allBasePointsOnSand = false; break;
          }
          let yScan = CHUNK_HEIGHT -1;
          for (; yScan >= 0; yScan--){
            const voxelIdx = checkX + (yScan * CHUNK_SIZE) + (checkZ * CHUNK_SIZE * CHUNK_HEIGHT);
            const voxelTypeAtScan = data[voxelIdx];
            if(voxelTypeAtScan === VOXEL_TYPE_SAND || voxelTypeAtScan === VOXEL_TYPE_SAND_LIGHT || voxelTypeAtScan === VOXEL_TYPE_SAND_DARK) {
                 break; 
            }
            if(voxelTypeAtScan === VOXEL_TYPE_WATER || yScan < waterLevel) { 
                allBasePointsOnSand = false; break;
            }
          }
          if (!allBasePointsOnSand || yScan < waterLevel) {
            allBasePointsOnSand = false; break;
          }
          if (tempSurfaceY === -1) tempSurfaceY = yScan; 
          else if (Math.abs(tempSurfaceY - yScan) > 1) { // Allow slight variation for trunk base
            allBasePointsOnSand = false; break;
          }
        }
        if (!allBasePointsOnSand) break;
      }

      if (allBasePointsOnSand && tempSurfaceY !== -1) {
        treeBaseX = candidateX;
        treeBaseZ = candidateZ;
        surfaceY = tempSurfaceY; // Use the common or lowest valid Y for the base
        // Ensure all points of the trunk base are actually on sand if there was minor height variation
        for (let dx = 0; dx < trunkThickness; dx++) {
            for (let dz = 0; dz < trunkThickness; dz++) {
                const baseIndex = (treeBaseX + dx) + (surfaceY * CHUNK_SIZE) + ((treeBaseZ + dz) * CHUNK_SIZE * CHUNK_HEIGHT);
                const currentVoxel = data[baseIndex];
                if (!(currentVoxel === VOXEL_TYPE_SAND || currentVoxel === VOXEL_TYPE_SAND_LIGHT || currentVoxel === VOXEL_TYPE_SAND_DARK)) {
                    allBasePointsOnSand = false; break;
                }
            }
            if(!allBasePointsOnSand) break;
        }
        if(allBasePointsOnSand) break; // Valid position found and verified
      }
      attempts++;
    }

    if (surfaceY !== -1) { 
      const treeHeight = minPalmHeight + Math.floor(prng() * (maxPalmHeight - minPalmHeight + 1));
      let currentTrunkTipX = treeBaseX + Math.floor(trunkThickness / 2);
      let currentTrunkTipZ = treeBaseZ + Math.floor(trunkThickness / 2);
      
      for (let h = 1; h <= treeHeight; h++) {
        const yProgress = h / treeHeight;
        const curveDeltaX = Math.sin(yProgress * Math.PI) * (noise2DTrunkCurve(currentTrunkTipX * 0.1, h * 0.2) * 2 - 1) * curveFactor * (trunkThickness + 0.5);
        const curveDeltaZ = Math.sin(yProgress * Math.PI) * (noise2DTrunkCurve(currentTrunkTipZ * 0.1 + 100, h * 0.2) * 2 - 1) * curveFactor * (trunkThickness + 0.5);

        currentTrunkTipX = Math.round(currentTrunkTipX + curveDeltaX);
        currentTrunkTipZ = Math.round(currentTrunkTipZ + curveDeltaZ);
        currentTrunkTipX = Math.max(0, Math.min(CHUNK_SIZE - trunkThickness, currentTrunkTipX)); 
        currentTrunkTipZ = Math.max(0, Math.min(CHUNK_SIZE - trunkThickness, currentTrunkTipZ));

        for (let dx = 0; dx < trunkThickness; dx++) {
            for (let dz = 0; dz < trunkThickness; dz++) {
                const placeX = currentTrunkTipX + dx; 
                const placeZ = currentTrunkTipZ + dz;
                if (surfaceY + h < CHUNK_HEIGHT && placeX >=0 && placeX < CHUNK_SIZE && placeZ >=0 && placeZ < CHUNK_SIZE) {
                    const trunkIndex = placeX + ((surfaceY + h) * CHUNK_SIZE) + (placeZ * CHUNK_SIZE * CHUNK_HEIGHT);
                    if(data[trunkIndex] === VOXEL_TYPE_EMPTY || data[trunkIndex] === VOXEL_TYPE_WATER) {
                        data[trunkIndex] = VOXEL_TYPE_PALM_TRUNK;
                    }
                }
            }
        }
      }
      
      const frondBaseY = surfaceY + treeHeight + 1;
      const numFrondLayers = 3; 
      const frondLength = frondRadius; 

      for (let l = 0; l < numFrondLayers; l++) { 
        const layerY = frondBaseY + l;
        if (layerY >= CHUNK_HEIGHT) continue;
        const numFrondsInLayer = 8 - l * 2; 
        const currentLayerFrondLength = Math.max(1, frondLength - l * 1.5); 
        
        for (let f = 0; f < numFrondsInLayer; f++) { 
            const angle = (f / numFrondsInLayer) * Math.PI * 2 + (prng() - 0.5) * 0.5; 
            let frondTipX = currentTrunkTipX + Math.floor(trunkThickness/2); 
            let frondTipZ = currentTrunkTipZ + Math.floor(trunkThickness/2);

            for (let len = 0; len < currentLayerFrondLength; len++) {
                const stepX = Math.cos(angle) * (1 + (prng()-0.5)*0.3 ); 
                const stepZ = Math.sin(angle) * (1 + (prng()-0.5)*0.3 );
                const droopFactor = Math.pow(len / currentLayerFrondLength, 2);
                const droop = droopFactor * (frondRadius / 2.0); 
                
                frondTipX = Math.round(frondTipX + stepX);
                frondTipZ = Math.round(frondTipZ + stepZ);
                const frondY = Math.round(layerY - droop);

                if (frondY < waterLevel-1) break; 
                if (frondY >= CHUNK_HEIGHT || frondY < 0) continue;
                if (frondTipX < 0 || frondTipX >= CHUNK_SIZE || frondTipZ < 0 || frondTipZ >= CHUNK_SIZE) break; 

                const frondIndex = frondTipX + (frondY * CHUNK_SIZE) + (frondTipZ * CHUNK_SIZE * CHUNK_HEIGHT);
                if (data[frondIndex] === VOXEL_TYPE_EMPTY || data[frondIndex] === VOXEL_TYPE_WATER) {
                    data[frondIndex] = VOXEL_TYPE_PALM_FROND;
                }
            }
        }
      }
    }
  }
  // --- End of Re-added Palm Tree Generation ---

  // --- Generate Small Rocks --- 
  const numRockClusters = settings.rocks.countMin + Math.floor(prng() * (settings.rocks.countMax - settings.rocks.countMin + 1));
  for (let r = 0; r < numRockClusters; r++) {
    let attempts = 0;
    while (attempts < settings.rocks.maxPlacementAttempts) {
      const rockX = Math.floor(prng() * CHUNK_SIZE);
      const rockZ = Math.floor(prng() * CHUNK_SIZE);
      
      // Find surface Y for the rock
      let rockSurfaceY = -1;
      for (let yScan = CHUNK_HEIGHT - 1; yScan >= 0; yScan--) {
        const idx = rockX + (yScan * CHUNK_SIZE) + (rockZ * CHUNK_SIZE * CHUNK_HEIGHT);
        const voxelAtScan = data[idx];
        if (voxelAtScan === VOXEL_TYPE_SAND || voxelAtScan === VOXEL_TYPE_SAND_LIGHT || voxelAtScan === VOXEL_TYPE_SAND_DARK) {
          rockSurfaceY = yScan;
          break;
        }
        if (voxelAtScan === VOXEL_TYPE_WATER) break; // Don't place on water or if water is first thing found
      }

      if (rockSurfaceY !== -1 && rockSurfaceY >= waterLevel) { // Must be on sand and above water level
        const rockSize = 1; // Forced to 1x1x1 as per new settings/request
        // The loop for (let s = 0; s < rockSize; s++) will run once.
        const placeY = rockSurfaceY; // Place rock AT sand surface Y (effectively replacing it if it was empty or sand)
                                     // Or place ON TOP if we want it distinct: rockSurfaceY + 1 and check data[rockIndex] === VOXEL_TYPE_EMPTY
                                     // For a 1x1x1 pebble ON TOP of sand, it should be rockSurfaceY + 1, and check if that spot is empty.
                                     // Let's assume pebble replaces the top sand block to make it truly part of surface.
                                     // If it must be ON TOP, then placeY should be rockSurfaceY + 1, and data[rockIndex] should be VOXEL_TYPE_EMPTY.
                                     // Based on "1x1x1", placing ON the sand makes sense.

        // For a 1x1x1 pebble that sits ON the sand surface:
        const actualPlaceY = rockSurfaceY + 1;
        if (actualPlaceY < CHUNK_HEIGHT) {
            const rockIndex = rockX + (actualPlaceY * CHUNK_SIZE) + (rockZ * CHUNK_SIZE * CHUNK_HEIGHT);
            if (data[rockIndex] === VOXEL_TYPE_EMPTY) { // Only place if the spot above sand is empty
                data[rockIndex] = VOXEL_TYPE_ROCK;
                break; // Successfully placed a rock
            } else {
                // Spot obstructed, try another location for this rock cluster
            }
        } else {
            // Exceeds chunk height, try another location
        }
        // If we reach here, placement failed for this attempt, continue while loop
      }
      attempts++;
    }
  }
  // --- End of Small Rock Generation ---

  // --- Generate Beach Grass ---
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      let grassSurfaceY = -1;
      for (let yScan = CHUNK_HEIGHT - 1; yScan >= 0; yScan--) {
          const idx = x + (yScan * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
          const voxelAtScan = data[idx];
          if (voxelAtScan === VOXEL_TYPE_SAND || voxelAtScan === VOXEL_TYPE_SAND_LIGHT || voxelAtScan === VOXEL_TYPE_SAND_DARK) {
              grassSurfaceY = yScan;
              break;
          }
          if (voxelAtScan !== VOXEL_TYPE_EMPTY) break; 
      }

      if (grassSurfaceY !== -1 && grassSurfaceY >= waterLevel) {
        let isFarEnoughFromWater = true;
        const checkDist = settings.beachGrass.minDistanceFromWater;
        for (let d = 1; d <= checkDist; d++) {
          const zPlusIdx = x + (grassSurfaceY * CHUNK_SIZE) + (Math.min(CHUNK_SIZE -1, z + d) * CHUNK_SIZE * CHUNK_HEIGHT);
          const zMinusIdx = x + (grassSurfaceY * CHUNK_SIZE) + (Math.max(0, z - d) * CHUNK_SIZE * CHUNK_HEIGHT);
          const xPlusIdx = Math.min(CHUNK_SIZE -1, x + d) + (grassSurfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
          const xMinusIdx = Math.max(0, x + d) + (grassSurfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT); // Corrected: x + d should be x - d for xMinusIdx
          
          // Check if neighbor indices are valid before accessing data
          let zPlusIsWater = false, zMinusIsWater = false, xPlusIsWater = false, xMinusIsWater = false;
          if(z + d < CHUNK_SIZE) zPlusIsWater = data[zPlusIdx] === VOXEL_TYPE_WATER;
          if(z - d >= 0) zMinusIsWater = data[zMinusIdx] === VOXEL_TYPE_WATER;
          if(x + d < CHUNK_SIZE) xPlusIsWater = data[xPlusIdx] === VOXEL_TYPE_WATER;
          if(x - d >= 0) xMinusIsWater = data[xMinusIdx] === VOXEL_TYPE_WATER; // Corrected: x + d should be x - d

          if (zPlusIsWater || zMinusIsWater || xPlusIsWater || xMinusIsWater) {
            isFarEnoughFromWater = false;
            break;
          }
        }

        if (isFarEnoughFromWater && prng() < settings.beachGrass.densityFactor) {
          // const grassY = grassSurfaceY + 1; // Old: place on top
          const grassIndex = x + (grassSurfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
          // Replace the sand voxel with beach grass voxel
          data[grassIndex] = VOXEL_TYPE_BEACH_GRASS;
        }
      }
    }
  }
  // --- End of Beach Grass Generation ---

  return Array.from(data);
} 