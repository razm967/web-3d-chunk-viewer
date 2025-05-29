import { createNoise2D, createNoise3D } from 'simplex-noise';
import Alea from 'alea';
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  Voxel,
  VOXEL_TYPE_EMPTY,
  VOXEL_TYPE_STONE,
  VOXEL_TYPE_STONE_DARK,
  VOXEL_TYPE_STONE_LIGHT,
  VOXEL_TYPE_DIRT_MEDIUM,
  VOXEL_TYPE_CRYSTAL_RED,
  VOXEL_TYPE_CRYSTAL_BLUE,
  VOXEL_TYPE_CRYSTAL_GREEN,
  VOXEL_TYPE_CRYSTAL_PURPLE,
  VOXEL_TYPE_CRYSTAL_CLEAR,
  VOXEL_TYPE_CAVE_WALL,
  VOXEL_TYPE_CAVE_FLOOR,
  VOXEL_TYPE_GLOWSTONE
} from '../chunkUtils';
import { crystalCaveBiomeSettings as settings } from '../biomeSettings';

// Helper to get 2D noise normalized to 0-1 range
function getNormalizedNoise2D(noiseFunc: (x: number, y: number) => number, x: number, z: number, scale: number): number {
  return (noiseFunc(x / scale, z / scale) + 1) / 2;
}

// Helper to get 3D noise normalized to 0-1 range
function getNormalizedNoise3D(noiseFunc: (x: number, y: number, z: number) => number, x: number, y: number, z: number, scale: number): number {
  return (noiseFunc(x / scale, y / scale, z / scale) + 1) / 2;
}

// Helper to choose crystal type based on distribution
function chooseCrystalType(prng: () => number): number {
  const rand = prng();
  
  // New simplified distribution: only red (rare), purple, and clear
  if (rand < 0.1) return VOXEL_TYPE_CRYSTAL_RED;      // 10% red crystals (very rare)
  if (rand < 0.5) return VOXEL_TYPE_CRYSTAL_PURPLE;   // 40% purple crystals  
  return VOXEL_TYPE_CRYSTAL_CLEAR;                    // 50% clear crystals
}

// Helper to check if a position is adjacent to empty space (tunnel)
function isAdjacentToTunnel(data: Uint8Array, x: number, y: number, z: number): boolean {
  const directions = [
    [-1, 0, 0], [1, 0, 0], // left, right
    [0, -1, 0], [0, 1, 0], // down, up
    [0, 0, -1], [0, 0, 1]  // back, front
  ];
  
  for (const [dx, dy, dz] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    const nz = z + dz;
    
    if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_HEIGHT && nz >= 0 && nz < CHUNK_SIZE) {
      const index = nx + (ny * CHUNK_SIZE) + (nz * CHUNK_SIZE * CHUNK_HEIGHT);
      if (data[index] === VOXEL_TYPE_EMPTY) {
        return true;
      }
    }
  }
  return false;
}

// Helper to check if a position is adjacent to a cave wall
function isAdjacentToWall(data: Uint8Array, x: number, y: number, z: number): boolean {
  const directions = [
    [-1, 0, 0], [1, 0, 0], // left, right
    [0, -1, 0], [0, 1, 0], // down, up
    [0, 0, -1], [0, 0, 1]  // back, front
  ];
  
  for (const [dx, dy, dz] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    const nz = z + dz;
    
    if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_HEIGHT && nz >= 0 && nz < CHUNK_SIZE) {
      const index = nx + (ny * CHUNK_SIZE) + (nz * CHUNK_SIZE * CHUNK_HEIGHT);
      if (data[index] === VOXEL_TYPE_CAVE_WALL) {
        return true;
      }
    }
  }
  return false;
}

// Helper to create stalactites and stalagmites
function addCaveFormations(data: Uint8Array, x: number, y: number, z: number, prng: () => number, isFloor: boolean) {
  const formationHeight = Math.floor(prng() * 6) + 2; // 2-7 blocks tall
  const direction = isFloor ? 1 : -1; // Up for stalagmites, down for stalactites
  
  for (let i = 0; i < formationHeight; i++) {
    const currentY = y + (direction * i);
    if (currentY >= 0 && currentY < CHUNK_HEIGHT) {
      const index = x + (currentY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
      if (data[index] === VOXEL_TYPE_EMPTY) {
        // Taper the formation as it grows
        const taperChance = 1 - (i / formationHeight);
        if (prng() < taperChance) {
          data[index] = VOXEL_TYPE_STONE_DARK;
        }
      }
    }
  }
}

// Helper to get varied stone types
function getVariedStoneType(prng: () => number): number {
  const rand = prng();
  if (rand < 0.7) {
    return VOXEL_TYPE_STONE; // 60% regular stone
  } else if (rand < 0.85) {
    return VOXEL_TYPE_STONE_LIGHT; // 20% light stone
  } else {
    return VOXEL_TYPE_STONE_DARK; // 20% dark stone
  }
}

export function generateCrystalCaveChunkData(seed?: string): Voxel[] {
  const prng = seed ? Alea(seed) : Alea(Math.random().toString());
  
  // Create noise functions for tunnel variation and crystal placement
  const tunnelNoise = createNoise2D(Alea(seed + "tunnel"));
  const surfaceNoise = createNoise2D(Alea(seed + "surface"));
  const crystalNoise = createNoise2D(Alea(seed + "crystal"));
  const crystal3DNoise = createNoise3D(Alea(seed + "crystal3d")); // Add 3D noise for crystal shapes
  
  // Initialize with stone
  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
  
  // Fill with varied stone types
  for (let i = 0; i < data.length; i++) {
    data[i] = getVariedStoneType(prng);
  }
  
  // Phase 1: Generate surface terrain (thin layer on top)
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      // Create varied surface height
      const surfaceVariation = getNormalizedNoise2D(surfaceNoise, x, z, 30);
      const surfaceHeight = CHUNK_HEIGHT - 8 + Math.floor(surfaceVariation * 10); // Top 8-18 blocks
      
      // Fill surface layer
      for (let y = surfaceHeight; y < CHUNK_HEIGHT; y++) {
        const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        if (y === CHUNK_HEIGHT - 1) {
          data[index] = VOXEL_TYPE_DIRT_MEDIUM; // Grass/dirt on very top
        } else {
          data[index] = getVariedStoneType(prng);
        }
      }
    }
  }
  
  // Phase 2: Create the main tunnel
  const tunnelCenterY = Math.floor(CHUNK_HEIGHT * 0.6); // Tunnel at 60% height
  const tunnelCenterZ = CHUNK_SIZE / 2; // Center of chunk in Z direction
  const baseTunnelRadius = 70; // Base radius for the tunnel (doubled from 35)
  const baseTunnelHeight = 40; // Base height for the tunnel (doubled from 28)
  
  // Carve the tunnel from one side of the chunk to the other
  for (let x = 0; x < CHUNK_SIZE; x++) {
    // Calculate tunnel progress (0 to 1 from start to end)
    const progress = x / (CHUNK_SIZE - 1);
    
    // Add some variation to tunnel path using noise
    const pathVariationZ = getNormalizedNoise2D(tunnelNoise, x, 0, 40) * 20 - 20; // ±20 blocks variation (doubled from ±10)
    const pathVariationY = getNormalizedNoise2D(tunnelNoise, x, 100, 50) * 12 - 12; // ±12 blocks variation (doubled from ±6)
    
    const currentTunnelCenterZ = tunnelCenterZ + pathVariationZ;
    const currentTunnelCenterY = tunnelCenterY + pathVariationY;
    
    // Vary tunnel size along its length
    const sizeVariation = Math.sin(progress * Math.PI * 2) * 0.3 + 0.7; // 0.4 to 1.0 multiplier
    const currentRadius = baseTunnelRadius * sizeVariation;
    const currentHeight = baseTunnelHeight * sizeVariation;
    
    // Carve elliptical tunnel cross-section
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        
        // Calculate distance from tunnel center
        const deltaZ = z - currentTunnelCenterZ;
        const deltaY = y - currentTunnelCenterY;
        
        // Use ellipse equation: (deltaZ/radiusZ)² + (deltaY/radiusY)² <= 1
        const normalizedDistanceZ = deltaZ / currentRadius;
        const normalizedDistanceY = deltaY / (currentHeight / 2);
        const distanceFromCenter = normalizedDistanceZ * normalizedDistanceZ + normalizedDistanceY * normalizedDistanceY;
        
        // Add some organic variation to tunnel walls
        const wallNoise = getNormalizedNoise2D(tunnelNoise, y, z, 15);
        const noiseVariation = (wallNoise - 0.5) * 0.3; // ±0.15 variation
        
        if (distanceFromCenter <= 1.0 + noiseVariation) {
          data[index] = VOXEL_TYPE_EMPTY;
        }
      }
    }
  }
  
  // Phase 3: Convert stone adjacent to tunnel to cave walls - REMOVED
  // We'll keep the original stone variations instead of adding cave walls
  
  // Phase 4: Add crystal formations as separate structures in empty space
  const crystalPositions: Array<{x: number, y: number, z: number, type: number, isFloor: boolean}> = [];
  
  // Generate floor crystals (growing upward)
  for (let attempt = 0; attempt < 400 && crystalPositions.filter(c => c.isFloor).length < 70; attempt++) {
    const x = Math.floor(prng() * (CHUNK_SIZE - 10)) + 5; // Leave 5 block border for larger crystals
    const z = Math.floor(prng() * (CHUNK_SIZE - 10)) + 5; // Leave 5 block border
    
    // Find the floor level for this x,z position to prevent floating crystals
    let floorY = -1;
    for (let checkY = 0; checkY < CHUNK_HEIGHT; checkY++) {
      const checkIndex = x + (checkY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
      const checkVoxel = data[checkIndex];
      
      // Look for solid ground (stone) with empty space above
      if ((checkVoxel === VOXEL_TYPE_STONE || 
           checkVoxel === VOXEL_TYPE_STONE_LIGHT || 
           checkVoxel === VOXEL_TYPE_STONE_DARK) && 
          checkY + 1 < CHUNK_HEIGHT) {
        const aboveIndex = x + ((checkY + 1) * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        if (data[aboveIndex] === VOXEL_TYPE_EMPTY) {
          floorY = checkY + 1; // Place crystal on top of solid ground
          break;
        }
      }
    }
    
    if (floorY === -1 || floorY + 4 >= CHUNK_HEIGHT) continue; // Skip if no floor found or not enough height
    
    const y = floorY;
    const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
    
    // Only place crystals in empty space (tunnel area)
    if (data[index] === VOXEL_TYPE_EMPTY) {
      // Check if this position is far enough from existing crystals (minimum 6 blocks apart)
      let tooClose = false;
      for (const existing of crystalPositions) {
        const distance = Math.sqrt(
          Math.pow(x - existing.x, 2) + 
          Math.pow(y - existing.y, 2) + 
          Math.pow(z - existing.z, 2)
        );
        if (distance < 6) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        const crystalType = chooseCrystalType(prng);
        crystalPositions.push({x, y, z, type: crystalType, isFloor: true});
      }
    }
  }
  
  // Generate ceiling crystals (growing downward)
  for (let attempt = 0; attempt < 300 && crystalPositions.filter(c => !c.isFloor).length < 30; attempt++) {
    const x = Math.floor(prng() * (CHUNK_SIZE - 10)) + 5;
    const z = Math.floor(prng() * (CHUNK_SIZE - 10)) + 5;
    
    // Find the ceiling level for this x,z position
    let ceilingY = -1;
    for (let checkY = CHUNK_HEIGHT - 1; checkY >= 0; checkY--) {
      const checkIndex = x + (checkY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
      const checkVoxel = data[checkIndex];
      
      // Look for solid ceiling (stone) with empty space below
      if ((checkVoxel === VOXEL_TYPE_STONE || 
           checkVoxel === VOXEL_TYPE_STONE_LIGHT || 
           checkVoxel === VOXEL_TYPE_STONE_DARK) && 
          checkY - 1 >= 0) {
        const belowIndex = x + ((checkY - 1) * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        if (data[belowIndex] === VOXEL_TYPE_EMPTY) {
          ceilingY = checkY - 1; // Place crystal hanging from ceiling
          break;
        }
      }
    }
    
    if (ceilingY === -1 || ceilingY - 4 < 0) continue; // Skip if no ceiling found or not enough height
    
    const y = ceilingY;
    const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
    
    // Only place crystals in empty space (tunnel area)
    if (data[index] === VOXEL_TYPE_EMPTY) {
      // Check if this position is far enough from existing crystals
      let tooClose = false;
      for (const existing of crystalPositions) {
        const distance = Math.sqrt(
          Math.pow(x - existing.x, 2) + 
          Math.pow(y - existing.y, 2) + 
          Math.pow(z - existing.z, 2)
        );
        if (distance < 6) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        const crystalType = chooseCrystalType(prng);
        crystalPositions.push({x, y, z, type: crystalType, isFloor: false});
      }
    }
  }
  
  // Now place the crystals at the selected positions with exact specified shape
  for (const crystal of crystalPositions) {
    const {x, y, z, type, isFloor} = crystal;
    
    if (isFloor) {
      // Floor crystals growing upward: 1 voxel -> + shape -> line -> 1 voxel
      const crystalLevels = [
        // Level 0 (floor): single voxel
        [{dx: 0, dz: 0}],
        // Level 1: + shaped (middle + 4 sides)
        [{dx: 0, dz: 0}, {dx: 1, dz: 0}, {dx: -1, dz: 0}, {dx: 0, dz: 1}, {dx: 0, dz: -1}],
        // Level 2: line (middle + 2 sides) - using X axis
        [{dx: 0, dz: 0}, {dx: 1, dz: 0}, {dx: -1, dz: 0}],
        // Level 3: single voxel
        [{dx: 0, dz: 0}]
      ];
      
      for (let level = 0; level < crystalLevels.length; level++) {
        const crystalY = y + level;
        if (crystalY >= CHUNK_HEIGHT) break;
        
        for (const offset of crystalLevels[level]) {
          const crystalX = x + offset.dx;
          const crystalZ = z + offset.dz;
          
          if (crystalX >= 0 && crystalX < CHUNK_SIZE && 
              crystalZ >= 0 && crystalZ < CHUNK_SIZE) {
            const crystalIndex = crystalX + (crystalY * CHUNK_SIZE) + (crystalZ * CHUNK_SIZE * CHUNK_HEIGHT);
            
            if (data[crystalIndex] === VOXEL_TYPE_EMPTY) {
              data[crystalIndex] = type;
            }
          }
        }
      }
    } else {
      // Ceiling crystals growing downward: 1 voxel -> line -> + shape -> 1 voxel (opposite of floor)
      const crystalLevels = [
        // Level 0 (ceiling): single voxel
        [{dx: 0, dz: 0}],
        // Level 1: line (middle + 2 sides) - using X axis
        [{dx: 0, dz: 0}, {dx: 1, dz: 0}, {dx: -1, dz: 0}],
        // Level 2: + shaped (middle + 4 sides)
        [{dx: 0, dz: 0}, {dx: 1, dz: 0}, {dx: -1, dz: 0}, {dx: 0, dz: 1}, {dx: 0, dz: -1}],
        // Level 3: single voxel
        [{dx: 0, dz: 0}]
      ];
      
      for (let level = 0; level < crystalLevels.length; level++) {
        const crystalY = y - level; // Growing downward
        if (crystalY < 0) break;
        
        for (const offset of crystalLevels[level]) {
          const crystalX = x + offset.dx;
          const crystalZ = z + offset.dz;
          
          if (crystalX >= 0 && crystalX < CHUNK_SIZE && 
              crystalZ >= 0 && crystalZ < CHUNK_SIZE) {
            const crystalIndex = crystalX + (crystalY * CHUNK_SIZE) + (crystalZ * CHUNK_SIZE * CHUNK_HEIGHT);
            
            if (data[crystalIndex] === VOXEL_TYPE_EMPTY) {
              data[crystalIndex] = type;
            }
          }
        }
      }
    }
  }
  
  return Array.from(data);
} 