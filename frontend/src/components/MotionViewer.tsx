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

type BodyLink = {
  from: number;
  to: number;
  radius: number;
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);

const KIMODO_BODY_LINKS: BodyLink[] = [
  { from: 0, to: 1, radius: 0.085 },
  { from: 1, to: 2, radius: 0.09 },
  { from: 2, to: 3, radius: 0.1 },
  { from: 3, to: 4, radius: 0.055 },
  { from: 4, to: 5, radius: 0.05 },
  { from: 5, to: 6, radius: 0.055 },
  { from: 3, to: 11, radius: 0.05 },
  { from: 11, to: 12, radius: 0.045 },
  { from: 12, to: 13, radius: 0.04 },
  { from: 13, to: 14, radius: 0.034 },
  { from: 3, to: 39, radius: 0.05 },
  { from: 39, to: 40, radius: 0.045 },
  { from: 40, to: 41, radius: 0.04 },
  { from: 41, to: 42, radius: 0.034 },
  { from: 0, to: 67, radius: 0.065 },
  { from: 67, to: 68, radius: 0.06 },
  { from: 68, to: 69, radius: 0.05 },
  { from: 69, to: 70, radius: 0.036 },
  { from: 0, to: 72, radius: 0.065 },
  { from: 72, to: 73, radius: 0.06 },
  { from: 73, to: 74, radius: 0.05 },
  { from: 74, to: 75, radius: 0.036 },
];

const HUMANML3D_BODY_LINKS: BodyLink[] = [
  { from: 0, to: 3, radius: 0.085 },
  { from: 3, to: 6, radius: 0.09 },
  { from: 6, to: 9, radius: 0.1 },
  { from: 9, to: 12, radius: 0.055 },
  { from: 12, to: 15, radius: 0.055 },
  { from: 9, to: 13, radius: 0.05 },
  { from: 13, to: 16, radius: 0.045 },
  { from: 16, to: 18, radius: 0.04 },
  { from: 18, to: 20, radius: 0.034 },
  { from: 9, to: 14, radius: 0.05 },
  { from: 14, to: 17, radius: 0.045 },
  { from: 17, to: 19, radius: 0.04 },
  { from: 19, to: 21, radius: 0.034 },
  { from: 0, to: 1, radius: 0.065 },
  { from: 1, to: 4, radius: 0.06 },
  { from: 4, to: 7, radius: 0.05 },
  { from: 7, to: 10, radius: 0.036 },
  { from: 0, to: 2, radius: 0.065 },
  { from: 2, to: 5, radius: 0.06 },
  { from: 5, to: 8, radius: 0.05 },
  { from: 8, to: 11, radius: 0.036 },
];

function vec(point: number[]) {
  return new THREE.Vector3(point[0], point[1], point[2]);
}

function Capsule({ start, end, radius, color = '#7edcff' }: { start: number[]; end: number[]; radius: number; color?: string }) {
  const transform = useMemo(() => {
    const from = vec(start);
    const to = vec(end);
    const midpoint = from.clone().add(to).multiplyScalar(0.5);
    const direction = to.clone().sub(from);
    const length = direction.length();
    const quaternion = new THREE.Quaternion();
    if (length > 0.0001) {
      quaternion.setFromUnitVectors(Y_AXIS, direction.normalize());
    }
    return { midpoint, quaternion, length };
  }, [start, end]);

  if (transform.length < 0.0001) return null;

  return (
    <mesh position={transform.midpoint} quaternion={transform.quaternion}>
      <cylinderGeometry args={[radius, radius, transform.length, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} />
    </mesh>
  );
}

function JointBall({ point, radius, color }: { point: number[]; radius: number; color: string }) {
  return (
    <mesh position={point as [number, number, number]}>
      <sphereGeometry args={[radius, 18, 14]} />
      <meshStandardMaterial color={color} roughness={0.48} metalness={0.05} />
    </mesh>
  );
}

function GeneratedBody({ points }: { points: number[][] }) {
  const isKimodo = points.length === 77;
  const links = isKimodo ? KIMODO_BODY_LINKS : HUMANML3D_BODY_LINKS;
  const head = points[isKimodo ? 6 : 15];
  const chest = points[isKimodo ? 3 : 9];
  const hips = points[0];

  return (
    <group>
      {links.map((link, index) => {
        const start = points[link.from];
        const end = points[link.to];
        if (!start || !end) return null;
        const torso = link.from <= 2 && link.to <= 9;
        return (
          <Capsule
            key={`${link.from}-${link.to}-${index}`}
            start={start}
            end={end}
            radius={link.radius}
            color={torso ? '#5aa8d8' : '#78d6f5'}
          />
        );
      })}
      {hips && <JointBall point={hips} radius={0.09} color="#f0b14a" />}
      {chest && <JointBall point={chest} radius={0.105} color="#5aa8d8" />}
      {head && <JointBall point={head} radius={0.13} color="#f1c49a" />}
    </group>
  );
}

function GuideRig({ points, bones }: { points: number[][]; bones: number[][] }) {
  return (
    <group>
      {bones.map(([a, b], index) => {
        const start = points[a];
        const end = points[b];
        if (!start || !end) return null;
        return <Capsule key={`${a}-${b}-${index}`} start={start} end={end} radius={0.008} color="#2d7891" />;
      })}
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
        {points.length > 0 && <GeneratedBody points={points} />}
        {false && points.length > 0 && <GuideRig points={points} bones={bones} />}
        <Grid args={[12, 12]} cellSize={0.25} sectionSize={1} fadeDistance={14} sectionColor="#25404c" cellColor="#162832" />
        <CameraRig onResetRef={onResetRef} />
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 flex gap-4 font-mono text-[10px] tracking-widest text-slate-400">
        <span className="text-emerald-400">VIEWPORT</span>
        <span>{fps} FPS</span>
        <span>FRAME {frame}</span>
        <span>{points.length || 0} JOINTS</span>
      </div>
    </div>
  );
}
