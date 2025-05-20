import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  Voxel,
  VOXEL_TYPE_EMPTY
} from '../chunkUtils';
import { testPlainBiomeSettings as settings } from '../biomeSettings'; // Import specific settings

export function generateTestPlainChunkData(seed?: string): Voxel[] {
  // Seed is not used for this simple flat plain, but kept for consistent interface
  const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE).fill(VOXEL_TYPE_EMPTY);

  const plainSurfaceY = Math.floor(CHUNK_HEIGHT * settings.baseHeightFactor);
  const surfaceVoxelType = settings.voxelTypeId; // Get the voxel type from settings

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        const index = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        if (y < plainSurfaceY) {
          data[index] = surfaceVoxelType; // Use the configured voxel type
        } else {
          data[index] = VOXEL_TYPE_EMPTY;
        }
      }
      // Set the surface voxel explicitly in case plainSurfaceY is 0
      if (plainSurfaceY >= 0 && plainSurfaceY < CHUNK_HEIGHT) {
        const surfaceIndex = x + (plainSurfaceY * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
        data[surfaceIndex] = surfaceVoxelType;
      }
    }
  }
  return Array.from(data);
} 