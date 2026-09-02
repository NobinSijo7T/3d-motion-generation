import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { DEFAULT_BONES } from '../utils/skeleton';

type Props = {
  frames: number[][][];
  frame: number;
  fps: number;
  bones?: number[][];
  onResetRef?: (reset: () => void) => void;
};

function Skeleton({ points, bones }: { points: number[][]; bones: number[][] }) {
  const boneLines = useMemo(() => {
    return bones
      .map(([a, b], index) => {
        const start = points[a];
        const end = points[b];
        if (!start || !end) return null;
        return (
          <line key={index}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([...start, ...end])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#3aa0c4" />
          </line>
        );
      })
      .filter(Boolean);
  }, [points, bones]);

  return (
    <group>
      {points.map((point, index) => (
        <mesh key={index} position={point as [number, number, number]}>
          <sphereGeometry args={[index === 0 ? 0.045 : 0.028, 12, 8]} />
          <meshStandardMaterial color={index === 0 ? '#f0b14a' : '#67d2ff'} />
        </mesh>
      ))}
      {boneLines}
    </group>
  );
}

function CameraRig({ onResetRef }: { onResetRef?: (reset: () => void) => void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  useFrame(() => undefined);
  if (onResetRef) {
    onResetRef(() => {
      controls.current?.reset();
    });
  }
  return <OrbitControls ref={controls} makeDefault enablePan enableZoom />;
}

export function MotionViewer({ frames, frame, fps, bones = DEFAULT_BONES, onResetRef }: Props) {
  const points = frames[Math.min(frame, Math.max(0, frames.length - 1))] || [];
  return (
    <div className="relative min-h-[320px] flex-1 overflow-hidden border border-slate-800 bg-[#090d12]">
      <Canvas camera={{ position: [2.2, 1.8, 3.4], fov: 42 }}>
        <color attach="background" args={['#090d12']} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 6, 4]} intensity={1.4} />
        <axesHelper args={[0.6]} />
        {points.length > 0 && <Skeleton points={points} bones={bones} />}
        <Grid args={[12, 12]} cellSize={0.25} sectionSize={1} fadeDistance={14} sectionColor="#25404c" cellColor="#162832" />
        <CameraRig onResetRef={onResetRef} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 flex gap-4 font-mono text-[10px] tracking-widest text-slate-400">
        <span className="text-emerald-400">● VIEWPORT</span>
        <span>{fps} FPS</span>
        <span>FRAME {frame}</span>
        <span>{points.length || 0} JOINTS</span>
      </div>
    </div>
  );
}
