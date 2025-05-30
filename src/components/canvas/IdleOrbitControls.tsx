'use client';

import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CHUNK_SIZE, CHUNK_HEIGHT } from '@/lib/chunkUtils';

interface IdleOrbitControlsProps {
  target?: [number, number, number];
  enablePan?: boolean;
  enableZoom?: boolean;
  enableRotate?: boolean;
  idleTimeout?: number; // Time in seconds before idle mode starts
  idleSpinDuration?: number; // Duration of one complete spin in seconds
}

export default function IdleOrbitControls({
  target = [0, 0, 0],
  enablePan = true,
  enableZoom = true,
  enableRotate = true,
  idleTimeout = 7, // Start idle after 7 seconds
  idleSpinDuration = 30, // Complete spin in 30 seconds
}: IdleOrbitControlsProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Idle state management - using state for isIdleMode so component re-renders
  const [isIdleMode, setIsIdleMode] = useState(false);
  const lastInteractionTime = useRef(Date.now());
  const idleStartTime = useRef(0);
  const originalPosition = useRef(new THREE.Vector3());
  const originalTarget = useRef(new THREE.Vector3());
  const idealPosition = useRef(new THREE.Vector3());
  const idealTarget = useRef(new THREE.Vector3());
  const repositioningProgress = useRef(0);
  const isRepositioning = useRef(false);
  
  // Track camera state for idle detection
  const lastCameraPosition = useRef(new THREE.Vector3());
  const lastCameraTarget = useRef(new THREE.Vector3());
  const idleStartAngle = useRef(0); // Store the starting angle for consistency

  // Ideal camera position for idle spin (good viewing angle)
  const getIdealCameraPosition = (angle: number = idleStartAngle.current) => {
    const distance = CHUNK_SIZE * 1.2; // Good distance to see the whole chunk
    const height = CHUNK_HEIGHT * 0.2; // Lower angle - reduced from 0.8 to 0.4
    
    return new THREE.Vector3(
      Math.cos(angle) * distance,
      height,
      Math.sin(angle) * distance
    );
  };

  // Check if camera has moved significantly
  const hasCameraMoved = () => {
    if (!controlsRef.current || isIdleMode) return false; // Don't check during idle mode
    
    const positionDelta = camera.position.distanceTo(lastCameraPosition.current);
    const targetDelta = controlsRef.current.target.distanceTo(lastCameraTarget.current);
    
    // Consider movement if position or target changed by more than a small threshold
    return positionDelta > 0.1 || targetDelta > 0.1; // Increased threshold to avoid false positives
  };

  // Update last known camera state
  const updateLastCameraState = () => {
    if (!isIdleMode) { // Only update when not in idle mode
      lastCameraPosition.current.copy(camera.position);
      if (controlsRef.current) {
        lastCameraTarget.current.copy(controlsRef.current.target);
      }
    }
  };

  // Reset interaction timer when camera actually moves
  const resetInteractionTimer = () => {
    if (isIdleMode) {
      // Exit idle mode
      setIsIdleMode(false);
      isRepositioning.current = false;
      repositioningProgress.current = 0;
      
      // Re-enable controls
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      
      console.log('Exiting idle mode - controls re-enabled');
    }
    
    lastInteractionTime.current = Date.now();
    updateLastCameraState();
  };

  // Set up event listeners for camera movement detection
  useEffect(() => {
    // Initialize camera state tracking
    updateLastCameraState();
    
    // Listen for user interactions that should exit idle mode
    // CLICKING should exit idle mode, but mouse MOVEMENT should not
    const handleWheel = () => {
      if (isIdleMode) {
        console.log('User interaction detected (wheel) - exiting idle mode');
        resetInteractionTimer();
      }
    };
    
    const handleKeydown = () => {
      if (isIdleMode) {
        console.log('User interaction detected (keydown) - exiting idle mode');
        resetInteractionTimer();
      }
    };
    
    const handleMousedown = () => {
      if (isIdleMode) {
        console.log('User interaction detected (mousedown) - exiting idle mode');
        resetInteractionTimer();
      }
    };
    
    const handleClick = () => {
      if (isIdleMode) {
        console.log('User interaction detected (click) - exiting idle mode');
        resetInteractionTimer();
      }
    };
    
    const handleTouchstart = () => {
      if (isIdleMode) {
        console.log('User interaction detected (touchstart) - exiting idle mode');
        resetInteractionTimer();
      }
    };
    
    // Listen for interactions that should exit idle mode
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousedown', handleMousedown); // CLICKING exits idle
    window.addEventListener('click', handleClick); // Backup for clicking
    window.addEventListener('touchstart', handleTouchstart);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mousedown', handleMousedown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchstart', handleTouchstart);
    };
  }, [isIdleMode]); // Add isIdleMode as dependency

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    const currentTime = Date.now();
    const timeSinceLastInteraction = (currentTime - lastInteractionTime.current) / 1000;

    // Only check for camera movement when not in idle mode
    if (!isIdleMode && hasCameraMoved()) {
      resetInteractionTimer();
    }

    // Check if we should enter idle mode
    if (!isIdleMode && timeSinceLastInteraction > idleTimeout) {
      setIsIdleMode(true);
      idleStartTime.current = currentTime;
      isRepositioning.current = true;
      repositioningProgress.current = 0;
      
      // Store current camera state
      originalPosition.current.copy(camera.position);
      originalTarget.current.copy(controlsRef.current.target);
      
      // Calculate the angle from current camera position to target for consistency
      const currentToTarget = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target);
      currentToTarget.y = 0; // Project to horizontal plane
      idleStartAngle.current = Math.atan2(currentToTarget.z, currentToTarget.x);
      
      // Calculate ideal position and target using the same angle
      idealPosition.current.copy(getIdealCameraPosition(idleStartAngle.current));
      idealTarget.current.set(0, CHUNK_HEIGHT * 0.1, 0); // Lower target - reduced from 0.3 to 0.2
      
      // Disable controls during idle mode
      controlsRef.current.enabled = false;
      
      console.log('Entering idle mode - repositioning camera from angle:', idleStartAngle.current);
      console.log('Original position:', originalPosition.current);
      console.log('Target position:', idealPosition.current);
    }

    // Handle idle mode
    if (isIdleMode) {
      // Repositioning phase - smoothly move camera to ideal position
      if (isRepositioning.current) {
        const repositionDuration = 2; // 2 seconds to reposition
        repositioningProgress.current += delta / repositionDuration;
        
        if (repositioningProgress.current >= 1) {
          repositioningProgress.current = 1;
          isRepositioning.current = false;
          
          // Update the starting angle based on the final repositioned position
          // This ensures the spin starts from where we actually ended up
          const finalToTarget = new THREE.Vector3().subVectors(idealPosition.current, idealTarget.current);
          finalToTarget.y = 0; // Project to horizontal plane
          idleStartAngle.current = Math.atan2(finalToTarget.z, finalToTarget.x);
          
          console.log('Camera repositioning complete - starting idle spin from angle:', idleStartAngle.current);
        }
        
        // Smooth interpolation to ideal position
        const t = repositioningProgress.current;
        // Use easeInOutCubic for smooth movement
        const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        // Interpolate camera position
        camera.position.lerpVectors(originalPosition.current, idealPosition.current, easedT);
        
        // Interpolate target
        const currentTarget = new THREE.Vector3().lerpVectors(
          originalTarget.current, 
          idealTarget.current, 
          easedT
        );
        controlsRef.current.target.copy(currentTarget);
        
        // Make camera look at target
        camera.lookAt(currentTarget);
        
        console.log('Repositioning progress:', easedT, 'Camera pos:', camera.position);
      } 
      // Spinning phase - rotate around the chunk
      else {
        const spinElapsed = (currentTime - idleStartTime.current) / 1000;
        const spinProgress = (spinElapsed % idleSpinDuration) / idleSpinDuration;
        // Start from the angle we calculated after repositioning
        const angle = idleStartAngle.current + (spinProgress * Math.PI * 2);
        
        // Calculate new camera position in a circle around the target
        const distance = idealPosition.current.distanceTo(idealTarget.current);
        const newPosition = new THREE.Vector3(
          Math.cos(angle) * distance + idealTarget.current.x,
          idealPosition.current.y,
          Math.sin(angle) * distance + idealTarget.current.z
        );
        
        // Update camera position and make it look at target
        camera.position.copy(newPosition);
        camera.lookAt(idealTarget.current);
        // Don't update controls target during spinning since controls are disabled
        
        // Log occasionally to verify spinning
        if (Math.floor(spinElapsed) % 5 === 0 && spinElapsed % 1 < 0.1) {
          console.log('Spinning - angle:', angle, 'progress:', spinProgress, 'position:', newPosition);
        }
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={target}
      enablePan={enablePan}
      enableZoom={enableZoom}
      enableRotate={enableRotate}
      onChange={isIdleMode ? undefined : () => {
        // Only respond to changes when NOT in idle mode
        resetInteractionTimer();
      }}
    />
  );
} 