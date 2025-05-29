'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT, Voxel, VOXEL_TYPE_EMPTY } from '@/lib/chunkUtils';

interface FirstPersonCameraProps {
  movementSpeed?: number;
  lookSpeed?: number;
  jumpHeight?: number;
  gravity?: number;
  voxelData?: Voxel[];
}

export default function FirstPersonCamera({ 
  movementSpeed = 8, 
  lookSpeed = 0.003,
  jumpHeight = 12,
  gravity = 30,
  voxelData
}: FirstPersonCameraProps) {
  const { camera, gl } = useThree();
  const keysPressed = useRef<Set<string>>(new Set());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const isLocked = useRef(false);
  
  // Enhanced physics state
  const verticalVelocity = useRef(0);
  const horizontalVelocity = useRef(new THREE.Vector3(0, 0, 0)); // Track horizontal momentum
  const isOnGround = useRef(false);
  const groundFriction = 0.85; // Reduced friction for more responsive movement (was 0.8)
  const airResistance = 0.99; // Less air resistance for smoother movement (was 0.98)
  const jumpBoostMultiplier = 0.3; // How much horizontal velocity affects jump height

  // Collision detection helper functions
  const getVoxelAt = (x: number, y: number, z: number): Voxel => {
    if (!voxelData) return VOXEL_TYPE_EMPTY;
    
    // Convert world coordinates to voxel coordinates
    const voxelX = Math.floor(x + CHUNK_SIZE / 2);
    const voxelY = Math.floor(y + CHUNK_HEIGHT / 2);
    const voxelZ = Math.floor(z + CHUNK_SIZE / 2);
    
    // Check bounds
    if (voxelX < 0 || voxelX >= CHUNK_SIZE || 
        voxelY < 0 || voxelY >= CHUNK_HEIGHT || 
        voxelZ < 0 || voxelZ >= CHUNK_SIZE) {
      return VOXEL_TYPE_EMPTY;
    }
    
    const index = voxelX + (voxelY * CHUNK_SIZE) + (voxelZ * CHUNK_SIZE * CHUNK_HEIGHT);
    return voxelData[index] || VOXEL_TYPE_EMPTY;
  };

  const isVoxelSolid = (voxelType: Voxel): boolean => {
    return voxelType !== VOXEL_TYPE_EMPTY;
  };

  const checkCollision = (position: THREE.Vector3): boolean => {
    // Check collision at player's position (considering player height)
    const playerHeight = 1.8; // Player is about 2 blocks tall
    const playerRadius = 0.4; // Slightly larger player width for better collision
    const eyeHeight = 1.6; // Camera height relative to feet (eye level)

    // More comprehensive collision points around the player's capsule
    // Note: position represents the camera (eye) position, so we need to offset downward for feet
    const feetY = position.y - eyeHeight; // Calculate feet position from camera position
    
    const checkPoints = [
      // Bottom level (feet)
      { x: position.x, y: feetY + 0.1, z: position.z },
      { x: position.x + playerRadius, y: feetY + 0.1, z: position.z },
      { x: position.x - playerRadius, y: feetY + 0.1, z: position.z },
      { x: position.x, y: feetY + 0.1, z: position.z + playerRadius },
      { x: position.x, y: feetY + 0.1, z: position.z - playerRadius },
      { x: position.x + playerRadius * 0.7, y: feetY + 0.1, z: position.z + playerRadius * 0.7 },
      { x: position.x - playerRadius * 0.7, y: feetY + 0.1, z: position.z + playerRadius * 0.7 },
      { x: position.x + playerRadius * 0.7, y: feetY + 0.1, z: position.z - playerRadius * 0.7 },
      { x: position.x - playerRadius * 0.7, y: feetY + 0.1, z: position.z - playerRadius * 0.7 },
      
      // Middle level (torso)
      { x: position.x, y: feetY + playerHeight * 0.5, z: position.z },
      { x: position.x + playerRadius, y: feetY + playerHeight * 0.5, z: position.z },
      { x: position.x - playerRadius, y: feetY + playerHeight * 0.5, z: position.z },
      { x: position.x, y: feetY + playerHeight * 0.5, z: position.z + playerRadius },
      { x: position.x, y: feetY + playerHeight * 0.5, z: position.z - playerRadius },
      
      // Top level (head) - slightly below camera position
      { x: position.x, y: position.y + 0.15, z: position.z },
      { x: position.x + playerRadius, y: position.y + 0.15, z: position.z },
      { x: position.x - playerRadius, y: position.y + 0.15, z: position.z },
      { x: position.x, y: position.y + 0.15, z: position.z + playerRadius },
      { x: position.x, y: position.y + 0.15, z: position.z - playerRadius },
    ];

    return checkPoints.some(point => isVoxelSolid(getVoxelAt(point.x, point.y, point.z)));
  };

  const findGroundLevel = (x: number, z: number, startY: number): number => {
    const eyeHeight = 1.6; // Camera height relative to feet
    
    // Search downward from current position to find the ground
    // startY is camera position, so convert to feet position for ground search
    const startFeetY = startY - eyeHeight;
    
    for (let y = Math.floor(startFeetY); y >= -CHUNK_HEIGHT/2; y--) {
      const voxelType = getVoxelAt(x, y, z);
      if (isVoxelSolid(voxelType)) {
        // Found solid ground, return the camera position (eye level) above this voxel
        return y + 1 + eyeHeight;
      }
    }
    // If no ground found, return camera position at bottom of chunk
    return -CHUNK_HEIGHT/2 + eyeHeight;
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle ESC key to exit pointer lock
      if (event.code === 'Escape' && isLocked.current) {
        document.exitPointerLock();
        return;
      }
      
      // Handle jumping
      if (event.code === 'Space' && isOnGround.current && isLocked.current) {
        // Calculate jump velocity based on horizontal momentum (running jump vs standing jump)
        const horizontalSpeed = horizontalVelocity.current.length();
        const baseJumpVelocity = jumpHeight;
        const momentumBonus = horizontalSpeed * jumpBoostMultiplier;
        const totalJumpVelocity = baseJumpVelocity + momentumBonus;
        
        verticalVelocity.current = totalJumpVelocity;
        isOnGround.current = false;
        event.preventDefault();
        
        console.log(`Jump: Base=${baseJumpVelocity.toFixed(1)}, Speed=${horizontalSpeed.toFixed(1)}, Bonus=${momentumBonus.toFixed(1)}, Total=${totalJumpVelocity.toFixed(1)}`);
      }
      
      keysPressed.current.add(event.code.toLowerCase());
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code.toLowerCase());
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isLocked.current) return;

      try {
        // Get mouse movement deltas
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Update euler angles directly for infinite rotation
        euler.current.setFromQuaternion(camera.quaternion);
        euler.current.y -= movementX * lookSpeed;
        euler.current.x -= movementY * lookSpeed;
        
        // Clamp vertical rotation (prevent flipping upside down)
        euler.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, euler.current.x));
        
        // Apply rotation immediately
        camera.quaternion.setFromEuler(euler.current);
      } catch (error) {
        console.warn('Mouse movement error:', error);
      }
    };

    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement;
      if (!isLocked.current) {
        // Clear any pressed keys when exiting lock
        keysPressed.current.clear();
      }
    };

    const handlePointerLockError = () => {
      console.warn('Pointer lock error occurred');
      isLocked.current = false;
      keysPressed.current.clear();
    };

    const handleClick = () => {
      if (!isLocked.current) {
        try {
          gl.domElement.requestPointerLock();
        } catch (error) {
          console.warn('Failed to request pointer lock:', error);
        }
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);
    gl.domElement.addEventListener('click', handleClick);

    // Cleanup function
    return () => {
      // Exit pointer lock if still active
      if (isLocked.current) {
        try {
          document.exitPointerLock();
        } catch (error) {
          console.warn('Error exiting pointer lock:', error);
        }
      }
      
      // Clear pressed keys
      keysPressed.current.clear();
      
      // Remove event listeners
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [gl, lookSpeed, camera, jumpHeight]);

  useFrame((state, delta) => {
    if (!isLocked.current) return;

    try {
      // Calculate movement directions based on camera orientation
      camera.getWorldDirection(forward.current);
      forward.current.y = 0; // Keep movement horizontal
      forward.current.normalize();
      
      right.current.crossVectors(forward.current, camera.up).normalize();

      // Calculate desired movement based on pressed keys (acceleration, not instant velocity)
      const acceleration = new THREE.Vector3(0, 0, 0);
      const maxSpeed = movementSpeed;
      const accelerationRate = maxSpeed * 8; // Increased from 4 to 8 for faster acceleration

      if (keysPressed.current.has('keyw')) {
        acceleration.add(forward.current);
      }
      if (keysPressed.current.has('keys')) {
        acceleration.sub(forward.current);
      }
      if (keysPressed.current.has('keya')) {
        acceleration.sub(right.current);
      }
      if (keysPressed.current.has('keyd')) {
        acceleration.add(right.current);
      }

      // Apply acceleration to horizontal velocity
      if (acceleration.length() > 0) {
        acceleration.normalize();
        acceleration.multiplyScalar(accelerationRate * delta);
        horizontalVelocity.current.add(acceleration);
        
        // Cap horizontal velocity to max speed
        if (horizontalVelocity.current.length() > maxSpeed) {
          horizontalVelocity.current.normalize().multiplyScalar(maxSpeed);
        }
      }

      // Apply friction/air resistance to horizontal velocity
      const resistanceMultiplier = isOnGround.current ? groundFriction : airResistance;
      horizontalVelocity.current.multiplyScalar(Math.pow(resistanceMultiplier, delta * 60)); // Frame-rate independent

      // Apply horizontal movement with collision detection
      if (horizontalVelocity.current.length() > 0.01) { // Only move if velocity is significant
        const frameMovement = horizontalVelocity.current.clone().multiplyScalar(delta);
        
        // Use smaller incremental steps to prevent clipping through thin walls
        const steps = Math.max(1, Math.ceil(frameMovement.length() * 4));
        const stepX = frameMovement.x / steps;
        const stepZ = frameMovement.z / steps;
        
        // Test X movement in small increments
        for (let i = 0; i < steps; i++) {
          const testPosX = camera.position.clone();
          testPosX.x += stepX;
          if (!checkCollision(testPosX)) {
            camera.position.x = testPosX.x;
          } else {
            // Hit wall - reduce horizontal velocity in that direction
            horizontalVelocity.current.x *= 0.1;
            break;
          }
        }
        
        // Test Z movement in small increments
        for (let i = 0; i < steps; i++) {
          const testPosZ = camera.position.clone();
          testPosZ.z += stepZ;
          if (!checkCollision(testPosZ)) {
            camera.position.z = testPosZ.z;
          } else {
            // Hit wall - reduce horizontal velocity in that direction
            horizontalVelocity.current.z *= 0.1;
            break;
          }
        }
      }

      // Apply realistic gravity (accelerating downward)
      if (!isOnGround.current) {
        // Gravity accelerates downward velocity over time
        verticalVelocity.current -= gravity * delta;
        
        // Cap falling speed to terminal velocity (realistic physics)
        const terminalVelocity = -50; // Maximum falling speed
        verticalVelocity.current = Math.max(verticalVelocity.current, terminalVelocity);
      }

      // Test vertical movement with smaller increments for precision
      const verticalMovement = verticalVelocity.current * delta;
      const verticalSteps = Math.max(1, Math.ceil(Math.abs(verticalMovement) * 8));
      const stepY = verticalMovement / verticalSteps;

      for (let i = 0; i < verticalSteps; i++) {
        const testPosY = camera.position.clone();
        testPosY.y += stepY;

        // Check for collision at the new position
        if (!checkCollision(testPosY)) {
          camera.position.y = testPosY.y;
        } else {
          // Hit something - determine if it's ground or ceiling
          if (stepY < 0) {
            // Moving down - hit ground
            isOnGround.current = true;
            verticalVelocity.current = 0;
          } else {
            // Moving up - hit ceiling
            verticalVelocity.current = Math.min(0, verticalVelocity.current);
          }
          break;
        }
      }

      // Additional ground check using the findGroundLevel function as backup
      const groundLevel = findGroundLevel(camera.position.x, camera.position.z, camera.position.y);
      if (camera.position.y <= groundLevel + 0.1) {
        camera.position.y = Math.max(camera.position.y, groundLevel);
        if (!isOnGround.current) {
          verticalVelocity.current = 0;
          isOnGround.current = true;
        }
      } else {
        // Check if we're actually standing on something
        const testGroundPos = camera.position.clone();
        testGroundPos.y -= 0.2; // Check slightly below eye level
        if (!checkCollision(testGroundPos)) {
          isOnGround.current = false;
        }
      }

      // Keep player within chunk bounds (but allow vertical movement)
      const halfChunk = CHUNK_SIZE / 2 - 1;
      camera.position.x = Math.max(-halfChunk, Math.min(halfChunk, camera.position.x));
      camera.position.z = Math.max(-halfChunk, Math.min(halfChunk, camera.position.z));
      
      // Keep player within reasonable height bounds
      camera.position.y = Math.max(-CHUNK_HEIGHT/2, Math.min(CHUNK_HEIGHT * 1.5, camera.position.y));

    } catch (error) {
      console.warn('Frame update error:', error);
    }
  });

  return null;
} 