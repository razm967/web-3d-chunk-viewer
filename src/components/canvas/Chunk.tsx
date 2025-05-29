'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import {
  CHUNK_SIZE, CHUNK_HEIGHT, Voxel,
  VOXEL_TYPE_EMPTY, 
  VOXEL_TYPE_GRASS, VOXEL_TYPE_DIRT_LIGHT, VOXEL_TYPE_DIRT_MEDIUM, VOXEL_TYPE_DIRT_DARK,
  // Beach Biome Voxel Types
  VOXEL_TYPE_SAND, VOXEL_TYPE_SANDSTONE, VOXEL_TYPE_WATER, 
  VOXEL_TYPE_PALM_TRUNK, VOXEL_TYPE_PALM_FROND,
  VOXEL_TYPE_SAND_LIGHT,
  VOXEL_TYPE_SAND_DARK,
  VOXEL_TYPE_ROCK,         // Added
  VOXEL_TYPE_BEACH_GRASS,   // Added
  VOXEL_TYPE_FOREST_TRUNK, // Added for forest biome
  VOXEL_TYPE_FOREST_LEAVES, // Added for forest biome
  VOXEL_TYPE_FOREST_FLOOR_DETAIL, // Added
  VOXEL_TYPE_PEBBLE, // Added
  VOXEL_TYPE_STONE, // Added
  VOXEL_TYPE_STONE_LIGHT, // Added
  VOXEL_TYPE_STONE_DARK,  // Added
  VOXEL_TYPE_FOREST_LEAVES_ALT, // Added for forest biome alternate leaves
  VOXEL_TYPE_SNOW, // Added for snow
  // Crystal cave voxel types
  VOXEL_TYPE_CRYSTAL_RED,
  VOXEL_TYPE_CRYSTAL_BLUE,
  VOXEL_TYPE_CRYSTAL_GREEN,
  VOXEL_TYPE_CRYSTAL_PURPLE,
  VOXEL_TYPE_CRYSTAL_CLEAR,
  VOXEL_TYPE_CAVE_WALL,
  VOXEL_TYPE_CAVE_FLOOR,
  VOXEL_TYPE_GLOWSTONE,
} from '@/lib/chunkUtils';
import * as THREE from 'three';

interface ChunkProps {
  position?: [number, number, number];
  voxelData?: Voxel[];
  showWireframe?: boolean;
  hdrPath?: string | null;
}

// Terrain Colors
const grassColor = new THREE.Color(0x2E6F40);      
const dirtLightColor = new THREE.Color(0x9b7653);  
const dirtMediumColor = new THREE.Color(0x70543E); 
const dirtDarkColor = new THREE.Color(0x4F3A2B);   

// Beach Biome Colors
const sandColor = new THREE.Color(0xf4e0aC);        // Light yellow
const sandLightColor = new THREE.Color(0xf8e8bC);  // Lighter sand
const sandDarkColor = new THREE.Color(0xe0d09C);   // Darker sand
const sandstoneColor = new THREE.Color(0xd8c08c);    // Slightly darker yellow/beige
const waterColor = new THREE.Color(0x4682B4);      // SteelBlue, will add transparency
const palmTrunkColor = new THREE.Color(0x8B4513);   // SaddleBrown
const palmFrondColor = new THREE.Color(0x228B22);   // ForestGreen
const rockColor = new THREE.Color(0x888888);       // Medium grey for rocks
const beachGrassColor = new THREE.Color(0xA0A070); // Muted olive/khaki for beach grass

// Forest Biome Colors
const forestTrunkColor = new THREE.Color(0x5D4037); // Darker brown for forest trunks (e.g., Burnt Umber)
const forestLeavesColor = new THREE.Color(0x2E7D32); // Darker, rich green for forest leaves (e.g., Pine Green)
const forestFloorDetailColor = new THREE.Color(0x4A3B31); // Dark, earthy brown for floor details
const pebbleColor = new THREE.Color(0xA9A9A9); // Light grey for pebbles (DarkGray)
const stoneColor = new THREE.Color(0x808080); // Medium grey for stone (Gray)
const stoneLightColor = new THREE.Color(0x989898); // Lighter grey for stone
const stoneDarkColor = new THREE.Color(0x686868);  // Darker grey for stone
const forestLeavesAltColor = new THREE.Color(0x558B2F); // Alternate leaf color
const snowColor = new THREE.Color(0xFFFFFF); // Pure white for snow

// Crystal colors with emissive properties
const crystalRedColor = new THREE.Color(0xFF4444); // Bright red
const crystalBlueColor = new THREE.Color(0x4488FF); // Bright blue
const crystalGreenColor = new THREE.Color(0x44FF44); // Bright green
const crystalPurpleColor = new THREE.Color(0xAA44FF);
const crystalClearColor = new THREE.Color(0xF0F0FF); // Clear/white with slight blue tint
const caveWallColor = new THREE.Color(0x666666); // Lighter grey for cave walls (was 0x333333)
const caveFloorColor = new THREE.Color(0x777777); // Slightly lighter grey for cave floor (was 0x444444)
const glowstoneColor = new THREE.Color(0xFFFF88); // Bright yellow for glowstone

// Enhanced crystal materials with emissive properties and transparency
const crystalRedMaterial = new THREE.MeshStandardMaterial({ 
  color: crystalRedColor,
  emissive: new THREE.Color(0xFF2222), // Much stronger red emissive glow
  emissiveIntensity: 3.0, // Dramatically increased from 0.8 to 3.0
  opacity: 0.8, 
  transparent: true,
  roughness: 0.05, // More reflective (reduced from 0.1)
  metalness: 0.3 // Increased from 0.1 for better light reflection
});

const crystalBlueMaterial = new THREE.MeshStandardMaterial({ 
  color: crystalBlueColor,
  emissive: new THREE.Color(0x2222FF), // Much stronger blue emissive glow
  emissiveIntensity: 3.0, // Dramatically increased from 0.8 to 3.0
  opacity: 0.8, 
  transparent: true,
  roughness: 0.05, // More reflective
  metalness: 0.3 // Increased for better light reflection
});

const crystalGreenMaterial = new THREE.MeshStandardMaterial({ 
  color: crystalGreenColor,
  emissive: new THREE.Color(0x22FF22), // Much stronger green emissive glow
  emissiveIntensity: 3.0, // Dramatically increased from 0.8 to 3.0
  opacity: 0.8, 
  transparent: true,
  roughness: 0.05, // More reflective
  metalness: 0.3 // Increased for better light reflection
});

const crystalPurpleMaterial = new THREE.MeshStandardMaterial({ 
  color: crystalPurpleColor,
  emissive: new THREE.Color(0xAA22FF), // Much stronger purple emissive glow
  emissiveIntensity: 3.0, // Dramatically increased from 0.8 to 3.0
  opacity: 0.8, 
  transparent: true,
  roughness: 0.05, // More reflective
  metalness: 0.3 // Increased for better light reflection
});

const crystalClearMaterial = new THREE.MeshStandardMaterial({ 
  color: crystalClearColor,
  emissive: new THREE.Color(0xAAAAFF), // Much stronger white-blue emissive glow
  emissiveIntensity: 2.5, // Dramatically increased from 0.6 to 2.5
  opacity: 0.7, 
  transparent: true,
  roughness: 0.02, // Very reflective
  metalness: 0.4 // High metalness for crystal-like reflection
});

// Enhanced glowstone material with stronger emissive properties
const glowstoneMaterial = new THREE.MeshStandardMaterial({ 
  color: glowstoneColor,
  emissive: new THREE.Color(0x444422), // Warm yellow emissive glow
  emissiveIntensity: 0.5,
  roughness: 0.3,
  metalness: 0.0
});

// Water material with transparency
const waterMaterial = new THREE.MeshStandardMaterial({ 
  color: waterColor, 
  opacity: 0.7, 
  transparent: true 
});

// Wireframe material instance for the custom water mesh
const wireframeMaterialInstance = new THREE.MeshBasicMaterial({ color: "black", wireframe: true });

// Original JSX element for wireframe on instanced meshes
const instancedWireframeMaterialElement = <meshBasicMaterial color="black" wireframe={true} />;

export default function Chunk({ 
  position = [0, 0, 0], 
  voxelData: initialVoxelData,
  showWireframe = false,
  hdrPath,
}: ChunkProps) {
  const { scene, gl } = useThree(); // Get scene and renderer (gl)

  // State for crystal lights
  // const [crystalLights, setCrystalLights] = React.useState<Array<{position: [number, number, number], color: string, intensity: number}>>([]);

  // Effect for loading HDR and setting background/environment
  useEffect(() => {
    console.log(`[Chunk.tsx] useEffect for background/environment. hdrPath: "${hdrPath}"`); // Log received hdrPath
    if (hdrPath && typeof hdrPath === 'string') {
      console.log(`[Chunk.tsx] Attempting to load HDR: ${hdrPath}`);
      const loader = new RGBELoader();
      loader.load(
        hdrPath,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          
          // Set HDR as environment and background
          scene.background = texture;
          scene.environment = texture;
          
          // Make the HDR much darker ONLY for cave HDR
          if (hdrPath && hdrPath.includes('cave')) {
            gl.toneMappingExposure = 0.3; // Slightly higher exposure to see crystal glow better
          } else {
            gl.toneMappingExposure = 1.0; // Normal exposure for other HDRs
          }
        },
        undefined, // onProgress
        (error) => {
          console.error(`Failed to load HDR from ${hdrPath}: `, error);
          // Use a much darker fallback color
          const darkSkyColor = new THREE.Color(0x111122); // Very dark blue
          scene.background = darkSkyColor;
          scene.environment = null;
        }
      );
    } else {
      console.log(`[Chunk.tsx] No valid HDR path, setting dark background.`);
      // Use a much darker fallback color
      const darkSkyColor = new THREE.Color(0x111122); // Very dark blue instead of light blue
      scene.background = darkSkyColor;
      scene.environment = null;
    }

    return () => {
      // Cleanup when component unmounts or scene changes
      const currentBackground = scene.background;
      const currentEnvironment = scene.environment;

      if (currentBackground instanceof THREE.Texture) {
        currentBackground.dispose();
      }
      if (currentEnvironment instanceof THREE.Texture) {
        // If environment is the same texture as background, it's already disposed.
        // If different, it needs its own dispose call. For safety, check identity if they could be same.
        if (currentEnvironment !== currentBackground) {
            currentEnvironment.dispose();
        }
      }
      scene.background = null; // Clear background reference
      scene.environment = null; // Clear environment reference
    };
  }, [scene, hdrPath, gl]); // Added gl back to dependency array

  // Existing refs
  const grassMeshRef = useRef<THREE.InstancedMesh>(null!);
  const dirtLightMeshRef = useRef<THREE.InstancedMesh>(null!);
  const dirtMediumMeshRef = useRef<THREE.InstancedMesh>(null!);
  const dirtDarkMeshRef = useRef<THREE.InstancedMesh>(null!);

  // Refs for Beach Biome (excluding water)
  const sandMeshRef = useRef<THREE.InstancedMesh>(null!);
  const sandLightMeshRef = useRef<THREE.InstancedMesh>(null!);
  const sandDarkMeshRef = useRef<THREE.InstancedMesh>(null!);
  const sandstoneMeshRef = useRef<THREE.InstancedMesh>(null!);
  // const waterMeshRef = useRef<THREE.InstancedMesh>(null!); // Removed for custom geometry
  const palmTrunkMeshRef = useRef<THREE.InstancedMesh>(null!);
  const palmFrondMeshRef = useRef<THREE.InstancedMesh>(null!);
  const rockMeshRef = useRef<THREE.InstancedMesh>(null!); // Added
  const beachGrassMeshRef = useRef<THREE.InstancedMesh>(null!); // Added

  // Refs for Forest Biome elements
  const forestTrunkMeshRef = useRef<THREE.InstancedMesh>(null!);
  const forestLeavesMeshRef = useRef<THREE.InstancedMesh>(null!);
  const forestFloorDetailMeshRef = useRef<THREE.InstancedMesh>(null!); // Added
  const pebbleMeshRef = useRef<THREE.InstancedMesh>(null!); // Added
  const stoneMeshRef = useRef<THREE.InstancedMesh>(null!); // Added
  const stoneLightMeshRef = useRef<THREE.InstancedMesh>(null!); // Added
  const stoneDarkMeshRef = useRef<THREE.InstancedMesh>(null!); // Added
  const forestLeavesAltMeshRef = useRef<THREE.InstancedMesh>(null!); // Ref for alternate leaves

  // Ref for custom water mesh
  const customWaterMeshRef = useRef<THREE.Mesh>(null!);

  // Add snow mesh ref
  const snowMeshRef = useRef<THREE.InstancedMesh>(null!);

  // Crystal cave mesh refs
  const crystalRedMeshRef = useRef<THREE.InstancedMesh>(null!);
  const crystalBlueMeshRef = useRef<THREE.InstancedMesh>(null!);
  const crystalGreenMeshRef = useRef<THREE.InstancedMesh>(null!);
  const crystalPurpleMeshRef = useRef<THREE.InstancedMesh>(null!);
  const crystalClearMeshRef = useRef<THREE.InstancedMesh>(null!);
  const caveWallMeshRef = useRef<THREE.InstancedMesh>(null!);
  const caveFloorMeshRef = useRef<THREE.InstancedMesh>(null!);
  const glowstoneMeshRef = useRef<THREE.InstancedMesh>(null!);

  const currentVoxelData = useMemo(() => initialVoxelData, [initialVoxelData]);

  useEffect(() => {
    if (!currentVoxelData) return;

    // References for instanced meshes (ensure they are all checked)
    const instancedMeshesReady = 
        grassMeshRef.current && dirtLightMeshRef.current && dirtMediumMeshRef.current && dirtDarkMeshRef.current &&
        sandMeshRef.current && sandLightMeshRef.current && sandDarkMeshRef.current && sandstoneMeshRef.current && 
        palmTrunkMeshRef.current && palmFrondMeshRef.current &&
        rockMeshRef.current && beachGrassMeshRef.current &&
        forestTrunkMeshRef.current && forestLeavesMeshRef.current && forestFloorDetailMeshRef.current &&
        pebbleMeshRef.current && stoneMeshRef.current && 
        stoneLightMeshRef.current && stoneDarkMeshRef.current && forestLeavesAltMeshRef.current &&
        snowMeshRef.current &&
        // Crystal cave mesh refs
        crystalRedMeshRef.current && crystalBlueMeshRef.current && crystalGreenMeshRef.current &&
        crystalPurpleMeshRef.current && crystalClearMeshRef.current && caveWallMeshRef.current &&
        caveFloorMeshRef.current && glowstoneMeshRef.current;

    if (!instancedMeshesReady) return;
    
    if (!customWaterMeshRef.current) {
        // Initialize the customWaterMesh if it doesn't exist
        // This happens once, or if the ref was somehow cleared
        // The actual geometry/material update happens below based on currentVoxelData
    }


    const tempObject = new THREE.Object3D();
    let grassCount = 0;
    let dirtLightCount = 0;
    let dirtMediumCount = 0;
    let dirtDarkCount = 0;
    let sandCount = 0;
    let sandLightCount = 0;
    let sandDarkCount = 0;
    let sandstoneCount = 0;
    // let waterCount = 0; // Removed
    let palmTrunkCount = 0;
    let palmFrondCount = 0;
    let rockCount = 0;        // Added
    let beachGrassCount = 0;  // Added
    let forestTrunkCount = 0; // Added
    let forestLeavesCount = 0;// Added
    let forestFloorDetailCount = 0; // Added
    let pebbleCount = 0; // Added
    let stoneCount = 0; // Added
    let stoneLightCount = 0; // Added
    let stoneDarkCount = 0; // Added
    let forestLeavesAltCount = 0; // Counter for alternate leaves
    let snowCount = 0; // Added for snow

    // Crystal cave counters
    let crystalRedCount = 0;
    let crystalBlueCount = 0;
    let crystalGreenCount = 0;
    let crystalPurpleCount = 0;
    let crystalClearCount = 0;
    let caveWallCount = 0;
    let caveFloorCount = 0;
    let glowstoneCount = 0;

    // Water geometry data
    const waterVertices: number[] = [];
    const waterIndices: number[] = [];
    const waterNormals: number[] = [];
    const waterUVs: number[] = []; // Basic UVs
    let waterVertexIndex = 0;

    // Helper to add a face (4 vertices, 6 indices)
    // prettier-ignore
    const addFace = (v1: number[], v2: number[], v3: number[], v4: number[], normal: number[]) => {
      waterVertices.push(...v1, ...v2, ...v3, ...v4);
      waterNormals.push(...normal, ...normal, ...normal, ...normal);
      waterUVs.push(0, 0, 1, 0, 0, 1, 1, 1); // Simple UV mapping for a quad
      waterIndices.push(waterVertexIndex, waterVertexIndex + 2, waterVertexIndex + 1, waterVertexIndex + 1, waterVertexIndex + 2, waterVertexIndex + 3);
      waterVertexIndex += 4;
    };

    const epsilon = 0.1; // Increased offset to prevent Z-fighting

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) { 
        for (let z = 0; z < CHUNK_SIZE; z++) { 
          const voxelArrayIndex = x + (y * CHUNK_SIZE) + (z * CHUNK_SIZE * CHUNK_HEIGHT);
          const voxelType: Voxel = currentVoxelData[voxelArrayIndex];
          
          const blockX = x - CHUNK_SIZE / 2 + 0.5;
          const blockY = y - CHUNK_HEIGHT / 2 + 0.5; 
          const blockZ = z - CHUNK_SIZE / 2 + 0.5; 
          
          if (voxelType === VOXEL_TYPE_EMPTY) continue;

          if (voxelType !== VOXEL_TYPE_WATER) {
            tempObject.position.set(blockX, blockY, blockZ);
            tempObject.updateMatrix();
          }

          switch (voxelType) {
            case VOXEL_TYPE_GRASS:
              grassMeshRef.current.setMatrixAt(grassCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_DIRT_LIGHT:
              dirtLightMeshRef.current.setMatrixAt(dirtLightCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_DIRT_MEDIUM:
              dirtMediumMeshRef.current.setMatrixAt(dirtMediumCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_DIRT_DARK:
              dirtDarkMeshRef.current.setMatrixAt(dirtDarkCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_SAND:
              sandMeshRef.current.setMatrixAt(sandCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_SAND_LIGHT:
              sandLightMeshRef.current.setMatrixAt(sandLightCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_SAND_DARK:
              sandDarkMeshRef.current.setMatrixAt(sandDarkCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_SANDSTONE:
              sandstoneMeshRef.current.setMatrixAt(sandstoneCount++, tempObject.matrix);
              break;
            // case VOXEL_TYPE_WATER: // Water is handled separately now
            //   waterMeshRef.current.setMatrixAt(waterCount++, tempObject.matrix);
            //   break;
            case VOXEL_TYPE_PALM_TRUNK:
              palmTrunkMeshRef.current.setMatrixAt(palmTrunkCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_PALM_FROND:
              palmFrondMeshRef.current.setMatrixAt(palmFrondCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_ROCK: // Added
              rockMeshRef.current.setMatrixAt(rockCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_BEACH_GRASS: // Added
              beachGrassMeshRef.current.setMatrixAt(beachGrassCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_FOREST_TRUNK: // Added
              forestTrunkMeshRef.current.setMatrixAt(forestTrunkCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_FOREST_LEAVES: // Added
              forestLeavesMeshRef.current.setMatrixAt(forestLeavesCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_FOREST_FLOOR_DETAIL: // Added
              forestFloorDetailMeshRef.current.setMatrixAt(forestFloorDetailCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_PEBBLE: // Added
              pebbleMeshRef.current.setMatrixAt(pebbleCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_STONE: // Added
              stoneMeshRef.current.setMatrixAt(stoneCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_STONE_LIGHT: // Added
              stoneLightMeshRef.current.setMatrixAt(stoneLightCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_STONE_DARK: // Added
              stoneDarkMeshRef.current.setMatrixAt(stoneDarkCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_FOREST_LEAVES_ALT: // Handling for alternate leaves
              forestLeavesAltMeshRef.current.setMatrixAt(forestLeavesAltCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_SNOW:
              snowMeshRef.current.setMatrixAt(snowCount++, tempObject.matrix);
              break;
            
            case VOXEL_TYPE_WATER: {
              // Check neighbors for water to build seamless mesh
              const neighbors = [
                { dir: [1, 0, 0], norm: [1, 0, 0] }, // Right (+X)
                { dir: [-1, 0, 0], norm: [-1, 0, 0] }, // Left (-X)
                { dir: [0, 1, 0], norm: [0, 1, 0] }, // Top (+Y)
                { dir: [0, -1, 0], norm: [0, -1, 0] }, // Bottom (-Y)
                { dir: [0, 0, 1], norm: [0, 0, 1] }, // Front (+Z)
                { dir: [0, 0, -1], norm: [0, 0, -1] }, // Back (-Z)
              ];

              for (const neighbor of neighbors) {
                const nx = x + neighbor.dir[0];
                const ny = y + neighbor.dir[1];
                const nz = z + neighbor.dir[2];

                let neighborType = VOXEL_TYPE_EMPTY;
                if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_HEIGHT && nz >= 0 && nz < CHUNK_SIZE) {
                  neighborType = currentVoxelData[nx + (ny * CHUNK_SIZE) + (nz * CHUNK_SIZE * CHUNK_HEIGHT)];
                }

                if (neighborType !== VOXEL_TYPE_WATER) { // If neighbor is not water (or out of bounds, treated as empty)
                  // This face is exposed, add it
                  // Define quad vertices based on face normal
                  // All coordinates are relative to block's center (blockX, blockY, blockZ)
                  // then shifted by 0.5 to get to the face.
                  // Example for +X face (normal [1,0,0]):
                  // v0 = [blockX + 0.5, blockY - 0.5, blockZ - 0.5]
                  // v1 = [blockX + 0.5, blockY + 0.5, blockZ - 0.5]
                  // v2 = [blockX + 0.5, blockY - 0.5, blockZ + 0.5]
                  // v3 = [blockX + 0.5, blockY + 0.5, blockZ + 0.5]
                  // Indices: 0,2,1, 1,2,3 (or similar for correct winding)
                  
                  // Simplified face definitions:
                  // Corners relative to block's origin (x,y,z from loop), then adjust to world-like chunk space
                  // blockX, blockY, blockZ are centers. We need corners.
                  // For voxel (x,y,z), its corners are (blockX +/- 0.5, blockY +/- 0.5, blockZ +/- 0.5)

                  const norm = neighbor.norm;
                  let v1_orig, v2_orig, v3_orig, v4_orig; // Original vertices before offset

                  if (norm[0] === 1) { // +X face
                    v1_orig = [blockX + 0.5, blockY - 0.5, blockZ - 0.5];
                    v2_orig = [blockX + 0.5, blockY + 0.5, blockZ - 0.5];
                    v3_orig = [blockX + 0.5, blockY - 0.5, blockZ + 0.5];
                    v4_orig = [blockX + 0.5, blockY + 0.5, blockZ + 0.5];
                  } else if (norm[0] === -1) { // -X face
                    v1_orig = [blockX - 0.5, blockY - 0.5, blockZ + 0.5];
                    v2_orig = [blockX - 0.5, blockY + 0.5, blockZ + 0.5];
                    v3_orig = [blockX - 0.5, blockY - 0.5, blockZ - 0.5];
                    v4_orig = [blockX - 0.5, blockY + 0.5, blockZ - 0.5];
                  } else if (norm[1] === 1) { // +Y face
                    v1_orig = [blockX - 0.5, blockY + 0.5, blockZ + 0.5];
                    v2_orig = [blockX + 0.5, blockY + 0.5, blockZ + 0.5];
                    v3_orig = [blockX - 0.5, blockY + 0.5, blockZ - 0.5];
                    v4_orig = [blockX + 0.5, blockY + 0.5, blockZ - 0.5];
                  } else if (norm[1] === -1) { // -Y face
                    v1_orig = [blockX - 0.5, blockY - 0.5, blockZ - 0.5];
                    v2_orig = [blockX + 0.5, blockY - 0.5, blockZ - 0.5];
                    v3_orig = [blockX - 0.5, blockY - 0.5, blockZ + 0.5];
                    v4_orig = [blockX + 0.5, blockY - 0.5, blockZ + 0.5];
                  } else if (norm[2] === 1) { // +Z face
                    v1_orig = [blockX + 0.5, blockY - 0.5, blockZ + 0.5];
                    v2_orig = [blockX + 0.5, blockY + 0.5, blockZ + 0.5];
                    v3_orig = [blockX - 0.5, blockY - 0.5, blockZ + 0.5];
                    v4_orig = [blockX - 0.5, blockY + 0.5, blockZ + 0.5];
                  } else { // -Z face (norm[2] === -1)
                    v1_orig = [blockX - 0.5, blockY - 0.5, blockZ - 0.5];
                    v2_orig = [blockX - 0.5, blockY + 0.5, blockZ - 0.5];
                    v3_orig = [blockX + 0.5, blockY - 0.5, blockZ - 0.5];
                    v4_orig = [blockX + 0.5, blockY + 0.5, blockZ - 0.5];
                  }
                  
                  // Apply offset: Pull vertices slightly inward along the normal
                  const v1 = [v1_orig[0] - norm[0] * epsilon, v1_orig[1] - norm[1] * epsilon, v1_orig[2] - norm[2] * epsilon];
                  const v2 = [v2_orig[0] - norm[0] * epsilon, v2_orig[1] - norm[1] * epsilon, v2_orig[2] - norm[2] * epsilon];
                  const v3 = [v3_orig[0] - norm[0] * epsilon, v3_orig[1] - norm[1] * epsilon, v3_orig[2] - norm[2] * epsilon];
                  const v4 = [v4_orig[0] - norm[0] * epsilon, v4_orig[1] - norm[1] * epsilon, v4_orig[2] - norm[2] * epsilon];

                  addFace(v1, v2, v3, v4, norm);
                }
              }
              break;
            } // End VOXEL_TYPE_WATER case

            // Crystal cave voxel types
            case VOXEL_TYPE_CRYSTAL_RED:
              crystalRedMeshRef.current.setMatrixAt(crystalRedCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_CRYSTAL_BLUE:
              crystalBlueMeshRef.current.setMatrixAt(crystalBlueCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_CRYSTAL_GREEN:
              crystalGreenMeshRef.current.setMatrixAt(crystalGreenCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_CRYSTAL_PURPLE:
              crystalPurpleMeshRef.current.setMatrixAt(crystalPurpleCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_CRYSTAL_CLEAR:
              crystalClearMeshRef.current.setMatrixAt(crystalClearCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_CAVE_WALL:
              caveWallMeshRef.current.setMatrixAt(caveWallCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_CAVE_FLOOR:
              caveFloorMeshRef.current.setMatrixAt(caveFloorCount++, tempObject.matrix);
              break;
            case VOXEL_TYPE_GLOWSTONE:
              glowstoneMeshRef.current.setMatrixAt(glowstoneCount++, tempObject.matrix);
              break;
          }
        }
      }
    }

    grassMeshRef.current.count = grassCount;
    dirtLightMeshRef.current.count = dirtLightCount;
    dirtMediumMeshRef.current.count = dirtMediumCount;
    dirtDarkMeshRef.current.count = dirtDarkCount;
    sandMeshRef.current.count = sandCount;
    sandLightMeshRef.current.count = sandLightCount;
    sandDarkMeshRef.current.count = sandDarkCount;
    sandstoneMeshRef.current.count = sandstoneCount;
    // waterMeshRef.current.count = waterCount; // Removed
    palmTrunkMeshRef.current.count = palmTrunkCount;
    palmFrondMeshRef.current.count = palmFrondCount;
    rockMeshRef.current.count = rockCount; // Added
    beachGrassMeshRef.current.count = beachGrassCount; // Added
    forestTrunkMeshRef.current.count = forestTrunkCount; // Added
    forestLeavesMeshRef.current.count = forestLeavesCount; // Added
    forestFloorDetailMeshRef.current.count = forestFloorDetailCount; // Added
    pebbleMeshRef.current.count = pebbleCount; // Added
    stoneMeshRef.current.count = stoneCount; // Added
    stoneLightMeshRef.current.count = stoneLightCount; // Added
    stoneDarkMeshRef.current.count = stoneDarkCount; // Added
    forestLeavesAltMeshRef.current.count = forestLeavesAltCount; // Set count for alternate leaves
    snowMeshRef.current.count = snowCount; // Added for snow

    // Update instance matrices for instanced meshes
    if (grassMeshRef.current.instanceMatrix) grassMeshRef.current.instanceMatrix.needsUpdate = true;
    if (dirtLightMeshRef.current.instanceMatrix) dirtLightMeshRef.current.instanceMatrix.needsUpdate = true;
    if (dirtMediumMeshRef.current.instanceMatrix) dirtMediumMeshRef.current.instanceMatrix.needsUpdate = true;
    if (dirtDarkMeshRef.current.instanceMatrix) dirtDarkMeshRef.current.instanceMatrix.needsUpdate = true;
    if (sandMeshRef.current.instanceMatrix) sandMeshRef.current.instanceMatrix.needsUpdate = true;
    if (sandLightMeshRef.current.instanceMatrix) sandLightMeshRef.current.instanceMatrix.needsUpdate = true;
    if (sandDarkMeshRef.current.instanceMatrix) sandDarkMeshRef.current.instanceMatrix.needsUpdate = true;
    if (sandstoneMeshRef.current.instanceMatrix) sandstoneMeshRef.current.instanceMatrix.needsUpdate = true;
    // if (waterMeshRef.current.instanceMatrix) waterMeshRef.current.instanceMatrix.needsUpdate = true; // Removed
    if (palmTrunkMeshRef.current.instanceMatrix) palmTrunkMeshRef.current.instanceMatrix.needsUpdate = true;
    if (palmFrondMeshRef.current.instanceMatrix) palmFrondMeshRef.current.instanceMatrix.needsUpdate = true;
    if (rockMeshRef.current.instanceMatrix) rockMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (beachGrassMeshRef.current.instanceMatrix) beachGrassMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (forestTrunkMeshRef.current.instanceMatrix) forestTrunkMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (forestLeavesMeshRef.current.instanceMatrix) forestLeavesMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (forestFloorDetailMeshRef.current.instanceMatrix) forestFloorDetailMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (pebbleMeshRef.current.instanceMatrix) pebbleMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (stoneMeshRef.current.instanceMatrix) stoneMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (stoneLightMeshRef.current.instanceMatrix) stoneLightMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (stoneDarkMeshRef.current.instanceMatrix) stoneDarkMeshRef.current.instanceMatrix.needsUpdate = true; // Added
    if (forestLeavesAltMeshRef.current.instanceMatrix) forestLeavesAltMeshRef.current.instanceMatrix.needsUpdate = true; // Update alternate leaves matrix
    if (snowMeshRef.current.instanceMatrix) snowMeshRef.current.instanceMatrix.needsUpdate = true; // Added for snow

    // Update custom water mesh
    if (customWaterMeshRef.current) {
      if (customWaterMeshRef.current.geometry) {
        customWaterMeshRef.current.geometry.dispose(); // Dispose old geometry
      }
      if (waterVertices.length > 0) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(waterVertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(waterUVs, 2));
        geometry.setIndex(waterIndices);
        customWaterMeshRef.current.geometry = geometry;
        customWaterMeshRef.current.material = waterMaterial; // Ensure material is set
        customWaterMeshRef.current.visible = true;
      } else {
        customWaterMeshRef.current.visible = false; // No water voxels, hide the mesh
      }
    }

    // Crystal cave counts
    crystalRedMeshRef.current.count = crystalRedCount;
    crystalBlueMeshRef.current.count = crystalBlueCount;
    crystalGreenMeshRef.current.count = crystalGreenCount;
    crystalPurpleMeshRef.current.count = crystalPurpleCount;
    crystalClearMeshRef.current.count = crystalClearCount;
    caveWallMeshRef.current.count = caveWallCount;
    caveFloorMeshRef.current.count = caveFloorCount;
    glowstoneMeshRef.current.count = glowstoneCount;

    // Crystal cave instance matrix updates
    if (crystalRedMeshRef.current.instanceMatrix) crystalRedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (crystalBlueMeshRef.current.instanceMatrix) crystalBlueMeshRef.current.instanceMatrix.needsUpdate = true;
    if (crystalGreenMeshRef.current.instanceMatrix) crystalGreenMeshRef.current.instanceMatrix.needsUpdate = true;
    if (crystalPurpleMeshRef.current.instanceMatrix) crystalPurpleMeshRef.current.instanceMatrix.needsUpdate = true;
    if (crystalClearMeshRef.current.instanceMatrix) crystalClearMeshRef.current.instanceMatrix.needsUpdate = true;
    if (caveWallMeshRef.current.instanceMatrix) caveWallMeshRef.current.instanceMatrix.needsUpdate = true;
    if (caveFloorMeshRef.current.instanceMatrix) caveFloorMeshRef.current.instanceMatrix.needsUpdate = true;
    if (glowstoneMeshRef.current.instanceMatrix) glowstoneMeshRef.current.instanceMatrix.needsUpdate = true;

    // Store crystal positions for point lights
    const crystalLights: Array<{position: [number, number, number], color: string, intensity: number}> = [];
    
    // Extract crystal positions from instance matrices for lighting
    const extractCrystalPositions = (mesh: THREE.InstancedMesh, color: string, intensity: number) => {
      if (!mesh || mesh.count === 0) return;
      
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();
      
      // Sample every 3rd crystal to avoid too many lights (performance)
      for (let i = 0; i < Math.min(mesh.count, 20); i += 3) {
        mesh.getMatrixAt(i, matrix);
        position.setFromMatrixPosition(matrix);
        crystalLights.push({
          position: [position.x, position.y, position.z],
          color,
          intensity
        });
      }
    };
    
    // Extract positions from each crystal type
    extractCrystalPositions(crystalRedMeshRef.current, '#FF4444', 2.0);
    extractCrystalPositions(crystalBlueMeshRef.current, '#4488FF', 2.0);
    extractCrystalPositions(crystalGreenMeshRef.current, '#44FF44', 2.0);
    extractCrystalPositions(crystalPurpleMeshRef.current, '#AA44FF', 2.0);
    extractCrystalPositions(crystalClearMeshRef.current, '#F0F0FF', 1.5);
    
    // Store lights in scene userData for rendering
    // scene.userData.crystalLights = crystalLights; // Removed - using state instead

    // Cleanup function (optional, but good practice for listeners or manual THREE object disposal)
    return () => {
      // Dispose of geometries and materials if they were created manually and are not part of JSX
    };
  }, [currentVoxelData, showWireframe, scene]); // Removed hdrPath from this effect's deps as it doesn't use it directly

  return (
    <group position={position}>
      {/* Ambient Light for overall scene illumination - much darker */}
      <ambientLight intensity={0.05} color="#FFDDBB" /> {/* Reduced from 0.2 to 0.05 */}

      {/* Directional Light to simulate a low sun and cast long shadows - much darker */}
      <directionalLight 
        color="#FFA500" // Orange color for sunset
        position={[15, 7, 10]} // Lowered Y, adjusted X/Z for angled evening light
        intensity={0.08} // Reduced from 0.3 to 0.08 for much darker lighting
        castShadow 
        shadow-mapSize-width={1024} 
        shadow-mapSize-height={1024}
        shadow-camera-far={50}      // How far the shadow camera can see
        shadow-camera-left={-20}    // Frustum of the shadow camera
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Existing instanced meshes for voxels... */}
      <instancedMesh ref={grassMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={grassColor} />
      </instancedMesh>
      {showWireframe && grassMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: grassMeshRef.current.geometry })}
      
      {/* Dirt Light */}
      <instancedMesh ref={dirtLightMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={dirtLightColor} />
      </instancedMesh>
      {showWireframe && dirtLightMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: dirtLightMeshRef.current.geometry })}

      {/* Dirt Medium */}
      <instancedMesh ref={dirtMediumMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={dirtMediumColor} />
      </instancedMesh>
      {showWireframe && dirtMediumMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: dirtMediumMeshRef.current.geometry })}

      {/* Dirt Dark */}
      <instancedMesh ref={dirtDarkMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={dirtDarkColor} />
      </instancedMesh>
      {showWireframe && dirtDarkMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: dirtDarkMeshRef.current.geometry })}
      
      {/* Sand */}
      <instancedMesh ref={sandMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={sandColor} />
      </instancedMesh>
      {showWireframe && sandMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: sandMeshRef.current.geometry })}

      {/* Sand Light */}
      <instancedMesh ref={sandLightMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={sandLightColor} />
      </instancedMesh>
      {showWireframe && sandLightMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: sandLightMeshRef.current.geometry })}

      {/* Sand Dark */}
      <instancedMesh ref={sandDarkMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={sandDarkColor} />
      </instancedMesh>
      {showWireframe && sandDarkMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: sandDarkMeshRef.current.geometry })}
      
      {/* Sandstone */}
      <instancedMesh ref={sandstoneMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={sandstoneColor} />
      </instancedMesh>
      {showWireframe && sandstoneMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: sandstoneMeshRef.current.geometry })}

      {/* Palm Trunk */}
      <instancedMesh ref={palmTrunkMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={palmTrunkColor} />
      </instancedMesh>
      {showWireframe && palmTrunkMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: palmTrunkMeshRef.current.geometry })}

      {/* Palm Frond */}
      <instancedMesh ref={palmFrondMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={palmFrondColor} />
      </instancedMesh>
      {showWireframe && palmFrondMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: palmFrondMeshRef.current.geometry })}

      {/* Rock */}
      <instancedMesh ref={rockMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={rockColor} />
      </instancedMesh>
      {showWireframe && rockMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: rockMeshRef.current.geometry })}

      {/* Beach Grass */}
      <instancedMesh ref={beachGrassMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={beachGrassColor} />
      </instancedMesh>
      {showWireframe && beachGrassMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: beachGrassMeshRef.current.geometry })}
      
      {/* Forest Trunk */}
      <instancedMesh ref={forestTrunkMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={forestTrunkColor} />
      </instancedMesh>
      {showWireframe && forestTrunkMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: forestTrunkMeshRef.current.geometry })}

      {/* Forest Leaves */}
      <instancedMesh ref={forestLeavesMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={forestLeavesColor} />
      </instancedMesh>
      {showWireframe && forestLeavesMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: forestLeavesMeshRef.current.geometry })}

      {/* Forest Floor Detail */}
      <instancedMesh ref={forestFloorDetailMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={forestFloorDetailColor} />
      </instancedMesh>
      {showWireframe && forestFloorDetailMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: forestFloorDetailMeshRef.current.geometry })}

      {/* Pebble */}
      <instancedMesh ref={pebbleMeshRef} args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} castShadow receiveShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={pebbleColor} />
      </instancedMesh>
      {showWireframe && pebbleMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: pebbleMeshRef.current.geometry })}

      {/* Stone */}
      <instancedMesh 
        ref={stoneMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={stoneColor} />
      </instancedMesh>
      {showWireframe && stoneMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: stoneMeshRef.current.geometry })}

      {/* Stone Light */}
      <instancedMesh 
        ref={stoneLightMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={stoneLightColor} />
      </instancedMesh>
      {showWireframe && stoneLightMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: stoneLightMeshRef.current.geometry })}

      {/* Stone Dark */}
      <instancedMesh 
        ref={stoneDarkMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={stoneDarkColor} />
      </instancedMesh>
      {showWireframe && stoneDarkMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: stoneDarkMeshRef.current.geometry })}

      {/* Forest Leaves Alternate */}
      <instancedMesh 
        ref={forestLeavesAltMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={forestLeavesAltColor} />
      </instancedMesh>
      {showWireframe && forestLeavesAltMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: forestLeavesAltMeshRef.current.geometry })}

      {/* Snow */}
      <instancedMesh 
        ref={snowMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={snowColor} />
      </instancedMesh>
      {showWireframe && snowMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: snowMeshRef.current.geometry })}

      {/* Crystal Red */}
      <instancedMesh 
        ref={crystalRedMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={crystalRedMaterial} />
      </instancedMesh>
      {showWireframe && crystalRedMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: crystalRedMeshRef.current.geometry })}

      {/* Crystal Blue */}
      <instancedMesh 
        ref={crystalBlueMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={crystalBlueMaterial} />
      </instancedMesh>
      {showWireframe && crystalBlueMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: crystalBlueMeshRef.current.geometry })}

      {/* Crystal Green */}
      <instancedMesh 
        ref={crystalGreenMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={crystalGreenMaterial} />
      </instancedMesh>
      {showWireframe && crystalGreenMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: crystalGreenMeshRef.current.geometry })}

      {/* Crystal Purple */}
      <instancedMesh 
        ref={crystalPurpleMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={crystalPurpleMaterial} />
      </instancedMesh>
      {showWireframe && crystalPurpleMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: crystalPurpleMeshRef.current.geometry })}

      {/* Crystal Clear */}
      <instancedMesh 
        ref={crystalClearMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={crystalClearMaterial} />
      </instancedMesh>
      {showWireframe && crystalClearMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: crystalClearMeshRef.current.geometry })}

      {/* Cave Wall */}
      <instancedMesh 
        ref={caveWallMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={caveWallColor} />
      </instancedMesh>
      {showWireframe && caveWallMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: caveWallMeshRef.current.geometry })}

      {/* Cave Floor */}
      <instancedMesh 
        ref={caveFloorMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={caveFloorColor} />
      </instancedMesh>
      {showWireframe && caveFloorMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: caveFloorMeshRef.current.geometry })}

      {/* Glowstone */}
      <instancedMesh 
        ref={glowstoneMeshRef} 
        args={[undefined, undefined, CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE]} 
        castShadow 
        receiveShadow 
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={glowstoneMaterial} />
      </instancedMesh>
      {showWireframe && glowstoneMeshRef.current && React.cloneElement(instancedWireframeMaterialElement, { geometry: glowstoneMeshRef.current.geometry })}

      {/* Custom Water Mesh */}
      <mesh ref={customWaterMeshRef} material={showWireframe ? wireframeMaterialInstance : waterMaterial} castShadow receiveShadow>
        {/* BufferGeometry will be attached here dynamically in useEffect */}
      </mesh>
    </group>
  );
}