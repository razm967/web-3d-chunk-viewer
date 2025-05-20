import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  Voxel,
  VOXEL_TYPE_EMPTY,
  VOXEL_TYPE_FOREST_TRUNK,
  VOXEL_TYPE_FOREST_LEAVES,
  VOXEL_TYPE_FOREST_LEAVES_ALT,
  VOXEL_TYPE_FOREST_FLOOR_DETAIL,
  VOXEL_TYPE_PEBBLE,
  VOXEL_TYPE_STONE,
  VOXEL_TYPE_STONE_LIGHT,
  VOXEL_TYPE_STONE_DARK,
  VOXEL_TYPE_GRASS,
  VOXEL_TYPE_DIRT_LIGHT,
  VOXEL_TYPE_DIRT_MEDIUM,
  getVoxel
} from '../chunkUtils';
import { forestBiomeSettings as settings } from '../biomeSettings'; // Import forest settings
import { createNoise2D } from 'simplex-noise';
import Alea from 'alea';

// Helper to get 2D noise normalized to 0-1 range, adapted for this generator
function getNormalizedNoise(noiseFunc: (x: number, y: number) => number, x: number, z: number, scale: number, amplitude: number): number {
  return (noiseFunc(x / scale, z / scale) + 1) / 2 * amplitude;
}

export function generateForestChunkData(seed?: string): Voxel[] {
  const prng = seed ? Alea(seed) : Alea(Math.random().toString());
  const noise2D = createNoise2D(prng);
  const noise2Dtrees = createNoise2D(Alea(seed + "_forest_trees")); // Separate noise for tree placement
  
  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(VOXEL_TYPE_EMPTY);

  const baseSurfaceY = Math.floor(CHUNK_HEIGHT * settings.baseHeightFactor);
  const surfaceGrassType = settings.voxelTypeId; // VOXEL_TYPE_GRASS
  const underSurfaceDirtType = settings.underSurfaceVoxelTypeId; // VOXEL_TYPE_DIRT_DARK
  const dirtDepth = settings.dirtLayerDepth; // How many layers of dirt under the surface grass/dirt patch
  const stoneType = VOXEL_TYPE_STONE; // Base stone type
  const stoneLightType = VOXEL_TYPE_STONE_LIGHT;
  const stoneDarkType = VOXEL_TYPE_STONE_DARK;

  // Helper function to get varied stone type - MOVED INSIDE
  function getVariedStoneType(): Voxel {
    const randomValue = prng(); // Now prng is accessible
    if (settings.stoneVariations) {
      if (randomValue < settings.stoneVariations.lightChance) {
        return stoneLightType;
      } else if (randomValue < settings.stoneVariations.lightChance + settings.stoneVariations.darkChance) {
        return stoneDarkType;
      }
    }
    return stoneType; // Default stone
  }

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const terrainNoise = getNormalizedNoise(
        noise2D, 
        x, 
        z, 
        settings.terrainNoiseScale, 
        settings.terrainNoiseAmplitude
      );
      const currentSurfaceY = Math.floor(baseSurfaceY + terrainNoise);
      const actualSurfaceY = Math.max(0, Math.min(CHUNK_HEIGHT - 1, currentSurfaceY));

      // Determine if the surface block is a dirt patch or grass
      let surfaceBlockType = surfaceGrassType;
      const randomValue = prng();
      if (randomValue < settings.surfaceDirtPatchChance) {
        surfaceBlockType = underSurfaceDirtType;
      } else if (randomValue < settings.surfaceDirtPatchChance + settings.forestFloorDetailChance) {
        surfaceBlockType = VOXEL_TYPE_FOREST_FLOOR_DETAIL;
      }

      // Place surface block (grass or dirt patch)
      if (actualSurfaceY >= 0) {
        const surfaceIndex = x + (actualSurfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        data[surfaceIndex] = surfaceBlockType;
      }

      // Place dirt blocks below the surface layer
      for (let d = 1; d <= dirtDepth; d++) {
        const dirtY = actualSurfaceY - d;
        if (dirtY >= 0) {
          const dirtIndex = x + (dirtY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
          let materialToPlace = underSurfaceDirtType;
          // Check for dirt-to-stone transition
          if (settings.dirtStoneTransition && d > dirtDepth - settings.dirtStoneTransition.depth) {
            if (prng() < settings.dirtStoneTransition.mixChance) {
              materialToPlace = getVariedStoneType();
            }
          }
          data[dirtIndex] = materialToPlace;
        } else {
          break; // Stop if we go below Y=0
        }
      }
      
      // Fill remaining space below dirt with stone down to Y=0
      for (let y = actualSurfaceY - dirtDepth - 1; y >= 0; y--) {
        const stoneIndex = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        let materialToPlace = getVariedStoneType();
        // Check for stone-to-dirt transition
        // y is the current stone layer; (actualSurfaceY - dirtDepth -1) is the topmost full stone layer
        if (settings.dirtStoneTransition && y > (actualSurfaceY - dirtDepth - 1) - settings.dirtStoneTransition.depth) {
          if (prng() < settings.dirtStoneTransition.mixChance) {
            materialToPlace = underSurfaceDirtType;
          }
        }
        data[stoneIndex] = materialToPlace;
      }
    }
  }

  // --- Pebble Generation ---
  const pebbleSettings = settings.pebbles;
  let pebbleCount = 0;
  if (pebbleSettings) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        if (pebbleCount >= pebbleSettings.maxPebblesPerChunk) break;
        // Find surface Y for pebble placement
        let surfaceY = -1;
        for (let yScan = CHUNK_HEIGHT - 1; yScan >= 0; yScan--) {
          const voxelIdx = x + (yScan * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
          const voxelAtScan = data[voxelIdx];
          if (voxelAtScan === surfaceGrassType || voxelAtScan === underSurfaceDirtType || voxelAtScan === VOXEL_TYPE_FOREST_FLOOR_DETAIL) {
            surfaceY = yScan;
            break;
          }
          if (voxelAtScan !== VOXEL_TYPE_EMPTY) break; // Stop if we hit something other than empty before finding ground
        }

        if (surfaceY !== -1 && surfaceY < pebbleSettings.maxYLevel) {
          if (prng() < pebbleSettings.densityFactor) {
            const pebbleY = surfaceY + 1;
            const pebbleIdx = x + (pebbleY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
            if (data[pebbleIdx] === VOXEL_TYPE_EMPTY) { // Ensure space is empty
              data[pebbleIdx] = VOXEL_TYPE_PEBBLE;
              pebbleCount++;
            }
          }
        }
      }
      if (pebbleCount >= pebbleSettings.maxPebblesPerChunk) break;
    }
  }
  // --- End of Pebble Generation ---

  // --- Border Hill Generation ---
  const hillSettings = settings.borderHillSettings;
  if (hillSettings && prng() < hillSettings.chance) {
    const numHills = 1 + Math.floor(prng() * hillSettings.maxHills);
    for (let h = 0; h < numHills; h++) {
      const hillRadius = hillSettings.minRadius + prng() * (hillSettings.maxRadius - hillSettings.minRadius);
      const hillHeight = hillSettings.minHeight + prng() * (hillSettings.maxHeight - hillSettings.minHeight);
      
      let hillCenterX, hillCenterZ;
      const side = Math.floor(prng() * 4); // 0: -X, 1: +X, 2: -Z, 3: +Z
      // Ensure hill center is within 0 to borderProximity-1 from the edge.
      const offsetFromEdge = Math.floor(prng() * hillSettings.borderProximity);

      if (side === 0) { // Near -X border
        hillCenterX = offsetFromEdge;
        hillCenterZ = prng() * CHUNK_SIZE;
      } else if (side === 1) { // Near +X border
        hillCenterX = CHUNK_SIZE - 1 - offsetFromEdge;
        hillCenterZ = prng() * CHUNK_SIZE;
      } else if (side === 2) { // Near -Z border
        hillCenterX = prng() * CHUNK_SIZE;
        hillCenterZ = offsetFromEdge;
      } else { // Near +Z border (side === 3)
        hillCenterX = prng() * CHUNK_SIZE;
        hillCenterZ = CHUNK_SIZE - 1 - offsetFromEdge;
      }

      for (let dx = -Math.ceil(hillRadius); dx <= Math.ceil(hillRadius); dx++) {
        for (let dz = -Math.ceil(hillRadius); dz <= Math.ceil(hillRadius); dz++) {
          const distSq = dx*dx + dz*dz;
          if (distSq <= hillRadius * hillRadius) {
            const currentX = Math.floor(hillCenterX + dx);
            const currentZ = Math.floor(hillCenterZ + dz);

            if (currentX >= 0 && currentX < CHUNK_SIZE && currentZ >= 0 && currentZ < CHUNK_SIZE) {
              // Find original surface Y at this X, Z
              let originalSurfaceY = -1;
              for (let yScan = CHUNK_HEIGHT - 1; yScan >= 0; yScan--) {
                const voxelIdxScan = currentX + (yScan * CHUNK_SIZE) + (currentZ * CHUNK_SIZE * CHUNK_HEIGHT);
                if (data[voxelIdxScan] !== VOXEL_TYPE_EMPTY && data[voxelIdxScan] !== VOXEL_TYPE_PEBBLE) { // Consider pebbles as on surface
                  originalSurfaceY = yScan;
                  break;
                }
              }
              if (originalSurfaceY === -1) continue; // Should not happen if base terrain exists

              const heightFactor = 1 - (distSq / (hillRadius * hillRadius)); // Simple parabolic falloff
              const additionalHeight = Math.floor(hillHeight * heightFactor);
              const newSurfaceY = originalSurfaceY + additionalHeight;
              
              // Determine the material of the original surface before the hill was added
              const originalSurfaceMaterialIdx = currentX + (originalSurfaceY * CHUNK_SIZE) + (currentZ * CHUNK_SIZE * CHUNK_HEIGHT);
              const hillSurfaceMaterial = data[originalSurfaceMaterialIdx];

              // Fill the raised part of the hill
              for (let fillY = originalSurfaceY + 1; fillY <= newSurfaceY; fillY++) {
                if (fillY < CHUNK_HEIGHT) {
                  const fillIdx = currentX + (fillY * CHUNK_SIZE) + (currentZ * CHUNK_SIZE * CHUNK_HEIGHT);
                  // Only overwrite if empty or pebble to avoid destroying other features if any
                  if (data[fillIdx] === VOXEL_TYPE_EMPTY || data[fillIdx] === VOXEL_TYPE_PEBBLE) { 
                    if (fillY < newSurfaceY) {
                      data[fillIdx] = getVariedStoneType(); // Inner part of the hill is stone
                    } else { // This is the new surface of the hill
                      data[fillIdx] = hillSurfaceMaterial; // Cover with original surface material
                    }
                  }
                }
              }

              // If the hill actually raised the terrain, convert original surface and dirt below to stone
              if (newSurfaceY > originalSurfaceY) {
                // Convert the block at originalSurfaceY to stone, as it's now buried
                if (originalSurfaceY >= 0 && originalSurfaceY < CHUNK_HEIGHT) { // Check bounds for safety
                    const originalSurfaceIdxToConvert = currentX + (originalSurfaceY * CHUNK_SIZE) + (currentZ * CHUNK_SIZE * CHUNK_HEIGHT);
                    data[originalSurfaceIdxToConvert] = getVariedStoneType();
                }

                // Convert dirt layers below the original surface to stone
                for (let y = originalSurfaceY - 1; y >= 0; y--) {
                    const idx = currentX + (y * CHUNK_SIZE) + (currentZ * CHUNK_SIZE * CHUNK_HEIGHT);
                    if (data[idx] === underSurfaceDirtType) { // Only convert actual dirt blocks
                        data[idx] = getVariedStoneType();
                    } else if (data[idx] === stoneType || data[idx] === stoneLightType || data[idx] === stoneDarkType || data[idx] === VOXEL_TYPE_EMPTY) {
                        break; // Found the base stone (any variant) or empty, stop.
                    }
                    // Other block types (e.g. original grass on a steep original slope that's now under) are left alone unless dirt
                }
              }
            }
          }
        }
      }

      // --- Attempt to Carve a Cave into the Hill ---
      const caveSettings = hillSettings.cave;
      if (caveSettings && prng() < caveSettings.chance && hillHeight >= caveSettings.minHillHeightRequired) {
        let entranceX, entranceZ, entranceY;
        let dxDirection, dzDirection; // Determines which way the cave digs

        // Determine entrance orientation based on which border the hill is near
        // Entrance should generally face inwards, towards the center of the chunk
        if (side === 0) { // Hill on -X border, cave goes +X
          entranceX = Math.floor(hillCenterX + hillRadius * 0.5); // Start entrance towards the hill's outward slope
          entranceZ = Math.floor(hillCenterZ);
          dxDirection = 1; dzDirection = 0;
        } else if (side === 1) { // Hill on +X border, cave goes -X
          entranceX = Math.floor(hillCenterX - hillRadius * 0.5);
          entranceZ = Math.floor(hillCenterZ);
          dxDirection = -1; dzDirection = 0;
        } else if (side === 2) { // Hill on -Z border, cave goes +Z
          entranceX = Math.floor(hillCenterX);
          entranceZ = Math.floor(hillCenterZ + hillRadius * 0.5);
          dxDirection = 0; dzDirection = 1;
        } else { // Hill on +Z border, cave goes -Z
          entranceX = Math.floor(hillCenterX);
          entranceZ = Math.floor(hillCenterZ - hillRadius * 0.5);
          dxDirection = 0; dzDirection = -1;
        }

        // Find original surface Y at the approximate entrance X,Z to determine cave floor height
        const originalTerrainNoiseAtEntrance = getNormalizedNoise(
          noise2D, 
          entranceX, 
          entranceZ, 
          settings.terrainNoiseScale, 
          settings.terrainNoiseAmplitude
        );
        const originalSurfaceYAtEntrance = Math.floor(baseSurfaceY + originalTerrainNoiseAtEntrance);
        
        entranceY = originalSurfaceYAtEntrance + caveSettings.floorOffset;

        // Carve the cave
        const halfWidth = Math.floor(caveSettings.entranceWidth / 2);
        const halfHeight = Math.floor(caveSettings.entranceHeight / 2); // Not used for floor, but for ceiling

        // Loop to extend the cave until it hits a chunk border
        for (let depth = 0; ; depth++) { // Infinite loop, will break internally
          const currentDepthX = entranceX + dxDirection * depth;
          const currentDepthZ = entranceZ + dzDirection * depth;

          // Stop if the current depth step is outside chunk boundaries
          if (!(currentDepthX >= 0 && currentDepthX < CHUNK_SIZE &&
                currentDepthZ >= 0 && currentDepthZ < CHUNK_SIZE)) {
            break; // Exit the depth loop
          }

          for (let w = -halfWidth; w <= halfWidth; w++) {
            for (let h = 0; h < caveSettings.entranceHeight; h++) {
              let caveX, caveZ;
              if (dxDirection !== 0) { // Cave along X axis
                caveX = currentDepthX;
                caveZ = currentDepthZ + w; 
              } else { // Cave along Z axis
                caveX = currentDepthX + w;
                caveZ = currentDepthZ;
              }
              const caveY = entranceY + h;

              if (caveX >= 0 && caveX < CHUNK_SIZE && caveY >= 0 && caveY < CHUNK_HEIGHT && caveZ >= 0 && caveZ < CHUNK_SIZE) {
                // Calculate the original natural surface Y at this specific caveX, caveZ
                const naturalTerrainNoiseAtCaveVoxel = getNormalizedNoise(
                  noise2D, 
                  caveX, 
                  caveZ, 
                  settings.terrainNoiseScale, 
                  settings.terrainNoiseAmplitude
                );
                const naturalSurfaceYAtCaveVoxel = Math.floor(baseSurfaceY + naturalTerrainNoiseAtCaveVoxel);

                const caveIdx = caveX + (caveY * CHUNK_SIZE) + (caveZ * CHUNK_SIZE * CHUNK_HEIGHT);
                
                // Only carve if the current voxel is part of the hill (i.e., above the original natural surface)
                // and is not already empty.
                if (caveY > naturalSurfaceYAtCaveVoxel && data[caveIdx] !== VOXEL_TYPE_EMPTY) {
                  data[caveIdx] = VOXEL_TYPE_EMPTY;
                }
              }
            }
          }
          // Optional: Slightly narrow the cave as it goes deeper (tapering)
          // if (depth > caveSettings.maxDepth / 2) { entranceWidth = Math.max(1, entranceWidth-1); halfWidth = ...}
        }
      }
      // --- End of Cave Carving ---
    }
  }
  // --- End of Border Hill Generation ---

  // --- Forest Tree Generation ---
  const treeSettings = settings.trees;
  const numTrees = treeSettings.countMin + Math.floor(prng() * (treeSettings.countMax - treeSettings.countMin + 1));
  const placedTreeBases: {x: number, z: number}[] = [];

  for (let i = 0; i < numTrees; i++) {
    let attempts = 0;
    while (attempts < treeSettings.maxPlacementAttempts) {
      attempts++;
      const treeBaseX = Math.floor(prng() * CHUNK_SIZE);
      const treeBaseZ = Math.floor(prng() * CHUNK_SIZE);

      // Check distance from other trees
      let tooClose = false;
      for (const otherTree of placedTreeBases) {
        const distSq = (treeBaseX - otherTree.x)**2 + (treeBaseZ - otherTree.z)**2;
        if (distSq < treeSettings.minDistFromOtherTree**2) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Check placement noise
      const placementNoiseVal = (noise2Dtrees(treeBaseX / treeSettings.placementNoiseScale, treeBaseZ / treeSettings.placementNoiseScale) + 1) / 2;
      if (placementNoiseVal < treeSettings.placementThreshold) continue;

      // Find surface Y at this treeBaseX, treeBaseZ
      let treeSurfaceY = -1;
      for (let yScan = CHUNK_HEIGHT - 1; yScan >= 0; yScan--) {
        const voxelIdx = treeBaseX + (yScan * CHUNK_SIZE) + (treeBaseZ * CHUNK_SIZE * CHUNK_HEIGHT);
        const voxelAtScan = data[voxelIdx];
        if (voxelAtScan === surfaceGrassType || voxelAtScan === underSurfaceDirtType || voxelAtScan === VOXEL_TYPE_FOREST_FLOOR_DETAIL) {
          treeSurfaceY = yScan;
          break;
        }
        if (voxelAtScan !== VOXEL_TYPE_EMPTY && voxelAtScan !== VOXEL_TYPE_PEBBLE) break; // Stop if we hit something other than non-surface empty before finding ground
      }

      if (treeSurfaceY === -1) continue; // No valid surface found

      // --- Check if on a steep hill slope to prevent tree spawning --- 
      const naturalTerrainNoise = getNormalizedNoise(noise2D, treeBaseX, treeBaseZ, settings.terrainNoiseScale, settings.terrainNoiseAmplitude);
      const naturalSurfaceY = Math.floor(baseSurfaceY + naturalTerrainNoise);
      if (treeSurfaceY > naturalSurfaceY + 3) { // If tree surface is 3+ voxels higher than natural terrain, likely a hill
          continue; // Skip placing tree here
      }
      // --- End of hill check ---

      // Place the tree
      const trunkHeight = treeSettings.minHeight + Math.floor(prng() * (treeSettings.maxHeight - treeSettings.minHeight + 1));
      const trunkTopY = treeSurfaceY + trunkHeight;
      const thickness = Math.max(1, Math.floor(treeSettings.trunkThickness)); // Ensure at least 1x1
      const offset = Math.floor(thickness / 2);

      // Place trunk
      for (let h = 1; h <= trunkHeight; h++) {
        const y = treeSurfaceY + h;
        if (y < CHUNK_HEIGHT) {
          for (let dx = 0; dx < thickness; dx++) {
            for (let dz = 0; dz < thickness; dz++) {
              const trunkX = treeBaseX - offset + dx;
              const trunkZ = treeBaseZ - offset + dz;
              if (trunkX >= 0 && trunkX < CHUNK_SIZE && trunkZ >= 0 && trunkZ < CHUNK_SIZE) {
                const trunkIdx = trunkX + (y * CHUNK_SIZE) + (trunkZ * CHUNK_SIZE * CHUNK_HEIGHT);
                // Ensure we don't overwrite existing parts of other trees or important features
                const existingVoxelAtTrunk = data[trunkIdx]; // Using direct array access as getVoxel might be for out-of-chunk reads or complex data structures
                if(existingVoxelAtTrunk === VOXEL_TYPE_EMPTY) {
                    data[trunkIdx] = VOXEL_TYPE_FOREST_TRUNK;
                }
              }
            }
          }
        }
      }

      // Place conical leaves
      const numLeafLayers = treeSettings.leafLayersMin + Math.floor(prng() * (treeSettings.leafLayersMax - treeSettings.leafLayersMin + 1));
      const baseRadius = treeSettings.baseLeafRadiusMax * (0.7 + prng() * 0.3); // Vary base radius slightly

      for (let l = 0; l < numLeafLayers; l++) {
        const layerProgress = l / (numLeafLayers -1 + Number.EPSILON); // Normalize from 0 to 1
        const currentRadius = Math.max(1, Math.ceil(baseRadius * (1 - layerProgress * 0.85))); // Taper radius, ensure min 1
        const layerCenterY = trunkTopY + 1 + (l * treeSettings.leafLayerHeight) + Math.floor(treeSettings.leafLayerHeight / 2);

        for (let dy = -Math.floor(treeSettings.leafLayerHeight / 2); dy <= Math.ceil(treeSettings.leafLayerHeight / 2); dy++) {
          const y = layerCenterY + dy;
          if (y <= treeSurfaceY || y >= CHUNK_HEIGHT) continue; // Ensure leaves are above ground and within chunk height

          for (let dx = -currentRadius; dx <= currentRadius; dx++) {
            for (let dz = -currentRadius; dz <= currentRadius; dz++) {
              if (dx*dx + dz*dz > currentRadius*currentRadius) continue; // Circular layers

              const leafX = treeBaseX + dx;
              const leafZ = treeBaseZ + dz;

              if (leafX >= 0 && leafX < CHUNK_SIZE && leafZ >= 0 && leafZ < CHUNK_SIZE) {
                const leafIdx = leafX + (y * CHUNK_SIZE) + (leafZ * CHUNK_SIZE * CHUNK_HEIGHT);
                const existingVoxel = data[leafIdx]; // Using direct array access

                // Prefer placing leaves if spot is empty or already a leaf type (for density and intermingling)
                if (existingVoxel === VOXEL_TYPE_EMPTY || existingVoxel === VOXEL_TYPE_FOREST_LEAVES || existingVoxel === VOXEL_TYPE_FOREST_LEAVES_ALT) {
                  // Determine leaf type for this specific voxel
                  const currentLeafType = prng() < settings.trees.altLeafChance 
                                        ? VOXEL_TYPE_FOREST_LEAVES_ALT 
                                        : VOXEL_TYPE_FOREST_LEAVES;
                  data[leafIdx] = currentLeafType;
                }
              }
            }
          }
        }
      }
      placedTreeBases.push({x: treeBaseX, z: treeBaseZ});
      break; // Successfully placed a tree
    }
  }
  // --- End of Forest Tree Generation ---

  return Array.from(data);
} 