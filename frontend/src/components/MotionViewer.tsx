import { Suspense, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid, OrbitControls, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DEFAULT_BONES } from '../utils/skeleton';

type Props = {
  frames: number[][][];
  frame: number;
  fps: number;
  prompt?: string;
  bones?: number[][];
  onResetRef?: (reset: () => void) => void;
};

type HandPositions = [THREE.Vector3 | null, THREE.Vector3 | null];

type BodyLink = {
  from: number;
  to: number;
  radius: number;
};

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const KIMODO_HANDS = [14, 42];
const HUMANML3D_HANDS = [20, 21];

type RigTarget = { bone: string; child: string; from: number; to: number };

const HUMAN_RIG_TARGETS: RigTarget[] = [
  { bone: 'Spine', child: 'Spine1', from: 3, to: 6 },
  { bone: 'Spine1', child: 'Spine2', from: 6, to: 9 },
  { bone: 'Spine2', child: 'Neck', from: 9, to: 12 },
  { bone: 'LeftShoulder', child: 'LeftArm', from: 13, to: 16 },
  { bone: 'LeftArm', child: 'LeftForeArm', from: 16, to: 18 },
  { bone: 'LeftForeArm', child: 'LeftHand', from: 18, to: 20 },
  { bone: 'RightShoulder', child: 'RightArm', from: 14, to: 17 },
  { bone: 'RightArm', child: 'RightForeArm', from: 17, to: 19 },
  { bone: 'RightForeArm', child: 'RightHand', from: 19, to: 21 },
  { bone: 'LeftUpLeg', child: 'LeftLeg', from: 1, to: 4 },
  { bone: 'LeftLeg', child: 'LeftFoot', from: 4, to: 7 },
  { bone: 'LeftFoot', child: 'LeftToeBase', from: 7, to: 10 },
  { bone: 'RightUpLeg', child: 'RightLeg', from: 2, to: 5 },
  { bone: 'RightLeg', child: 'RightFoot', from: 5, to: 8 },
  { bone: 'RightFoot', child: 'RightToeBase', from: 8, to: 11 },
];

const KIMODO_RIG_TARGETS: RigTarget[] = [
  { bone: 'Spine', child: 'Spine1', from: 1, to: 2 },
  { bone: 'Spine1', child: 'Spine2', from: 2, to: 3 }, { bone: 'Spine2', child: 'Neck', from: 3, to: 4 },
  { bone: 'LeftShoulder', child: 'LeftArm', from: 11, to: 12 },
  { bone: 'LeftArm', child: 'LeftForeArm', from: 12, to: 13 }, { bone: 'LeftForeArm', child: 'LeftHand', from: 13, to: 14 },
  { bone: 'RightShoulder', child: 'RightArm', from: 39, to: 40 }, { bone: 'RightArm', child: 'RightForeArm', from: 40, to: 41 },
  { bone: 'RightForeArm', child: 'RightHand', from: 41, to: 42 }, { bone: 'LeftUpLeg', child: 'LeftLeg', from: 67, to: 68 },
  { bone: 'LeftLeg', child: 'LeftFoot', from: 68, to: 69 }, { bone: 'LeftFoot', child: 'LeftToeBase', from: 69, to: 70 },
  { bone: 'RightUpLeg', child: 'RightLeg', from: 72, to: 73 }, { bone: 'RightLeg', child: 'RightFoot', from: 73, to: 74 },
  { bone: 'RightFoot', child: 'RightToeBase', from: 74, to: 75 },
];


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

function chairAnchorPose(poses: number[][][], prompt: string) {
  const text = prompt.toLowerCase();
  if (/stand(?:s)? up.*\bchair\b|chair.*stand(?:s)? up/.test(text)) return poses[0];
  if (/sit(?:s)? down.*\bchair\b|chair.*sit(?:s)? down/.test(text)) return poses[poses.length - 1];
  return poses.reduce((lowest, pose) => (pose[0][1] < lowest[0][1] ? pose : lowest));
}

function chairLayout(poses: number[][][]) {
  const floor = Math.min(...poses.flatMap((pose) => pose.map((point) => point[1] ?? 0)));
  const height = Math.max(...poses.flatMap((pose) => pose.map((point) => point[1] ?? floor))) - floor;
  const startPose = poses[0];
  const footPairs = startPose.length === 77 ? [[69, 70], [74, 75]] : [[7, 10], [8, 11]];
  const forward = footPairs.reduce((sum, [ankleIndex, toeIndex]) => {
    const ankle = startPose[ankleIndex];
    const toe = startPose[toeIndex];
    return ankle && toe ? sum.add(new THREE.Vector3(toe[0] - ankle[0], 0, toe[2] - ankle[2])) : sum;
  }, new THREE.Vector3());
  if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
  forward.normalize();
  return {
    floor,
    forward,
    seatHeight: THREE.MathUtils.clamp(Math.max(1.35, height) * 0.265, 0.38, 0.5),
    position: vec(startPose[0]).addScaledVector(forward, 1.05).setY(floor),
  };
}

function keepBodyInFrontOfChair(points: number[][], frames: number[][][], prompt: string, frame: number) {
  if (!/\bchair\b/i.test(prompt) || !points[0]) return points;
  const poses = (frames.length ? frames : [points]).filter((pose) => pose[0]);
  if (!poses.length) return points;

  const layout = chairLayout(poses);
  const t = frame / Math.max(1, frames.length - 1);
  const ease = (value: number) => value * value * (3 - 2 * value);
  let target = layout.position.clone();
  if (t < 0.35) {
    target = vec(poses[0][0]).lerp(layout.position, ease(t / 0.35));
  } else if (t > 0.72) {
    target.addScaledVector(layout.forward, 0.32 * ease((t - 0.72) / 0.28));
  }
  const offset = target.sub(vec(points[0]));
  return points.map((point) => [point[0] + offset.x, point[1], point[2] + offset.z]);
}

function seatedChairPoints(points: number[][], frames: number[][][], frame: number, prompt: string) {
  if (!/\bchair\b/i.test(prompt) || !/\b(sit|sits|sitting)\b/i.test(prompt) || !points[0] || !frames[0]) {
    return points;
  }
  const poses = frames.filter((pose) => pose[0]);
  if (!poses.length) return points;

  const t = frame / Math.max(1, frames.length - 1);
  const ease = (value: number) => value * value * (3 - 2 * value);
  const sitAmount = t < 0.35
    ? 0
    : t < 0.48
      ? ease((t - 0.35) / 0.13)
      : t < 0.72
        ? 1
        : t < 0.87
          ? 1 - ease((t - 0.72) / 0.15)
          : 0;
  if (sitAmount <= 0) return points;

  const layout = chairLayout(poses);
  const isKimodo = points.length === 77;
  const upperBody = isKimodo
    ? [0, 1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 39, 40, 41, 42]
    : [0, 3, 6, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const legChains = isKimodo
    ? [[67, 68, 69, 70], [72, 73, 74, 75]]
    : [[1, 4, 7, 10], [2, 5, 8, 11]];
  const base = frames[0];
  const desired = base.map((point) => [...point]);
  const baseRoot = vec(base[0]);
  const seatRoot = new THREE.Vector3(points[0][0], layout.floor + layout.seatHeight + 0.045, points[0][2]);
  const rootOffset = seatRoot.clone().sub(baseRoot);
  for (let index = 0; index < desired.length; index += 1) {
    desired[index][0] += rootOffset.x;
    desired[index][1] += rootOffset.y;
    desired[index][2] += rootOffset.z;
  }

  const side = new THREE.Vector3(-layout.forward.z, 0, layout.forward.x);
  for (const [chainIndex, [hipIndex, kneeIndex, ankleIndex, toeIndex]] of legChains.entries()) {
    const sideOffset = chainIndex === 0 ? -0.13 : 0.13;
    const hip = seatRoot.clone().addScaledVector(side, sideOffset).addScaledVector(layout.forward, 0.02);
    const knee = seatRoot.clone().addScaledVector(side, sideOffset).addScaledVector(layout.forward, 0.38).setY(layout.floor + layout.seatHeight * 0.88);
    const ankle = seatRoot.clone().addScaledVector(side, sideOffset).addScaledVector(layout.forward, 0.7).setY(layout.floor + 0.07);
    const toe = seatRoot.clone().addScaledVector(side, sideOffset).addScaledVector(layout.forward, 0.88).setY(layout.floor + 0.045);
    desired[hipIndex] = hip.toArray();
    desired[kneeIndex] = knee.toArray();
    desired[ankleIndex] = ankle.toArray();
    desired[toeIndex] = toe.toArray();
  }

  return points.map((point, index) => new THREE.Vector3(point[0], point[1], point[2])
    .lerp(vec(desired[index]), sitAmount)
    .toArray());
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
  const armLinks = isKimodo
    ? new Set(['3-11', '11-12', '12-13', '13-14', '3-39', '39-40', '40-41', '41-42'])
    : new Set(['9-13', '13-16', '16-18', '18-20', '9-14', '14-17', '17-19', '19-21']);
  const legLinks = isKimodo
    ? new Set(['0-67', '67-68', '68-69', '69-70', '0-72', '72-73', '73-74', '74-75'])
    : new Set(['0-1', '1-4', '4-7', '7-10', '0-2', '2-5', '5-8', '8-11']);

  return (
    <group>
      {hips && chest && <Capsule start={hips} end={chest} radius={0.145} color="#247fb7" />}
      {links.map((link, index) => {
        const start = points[link.from];
        const end = points[link.to];
        if (!start || !end) return null;
        const key = `${link.from}-${link.to}`;
        const isFoot = isKimodo ? link.to === 70 || link.to === 75 : link.to === 10 || link.to === 11;
        const color = legLinks.has(key) ? (isFoot ? '#1f2937' : '#29384d') : armLinks.has(key) ? '#d79a72' : '#3e87b8';
        return (
          <Capsule
            key={`${link.from}-${link.to}-${index}`}
            start={start}
            end={end}
            radius={link.radius}
            color={color}
          />
        );
      })}
      {hips && (
        <mesh position={hips as [number, number, number]} scale={[1.18, 0.78, 0.82]}>
          <sphereGeometry args={[0.12, 24, 18]} />
          <meshStandardMaterial color="#18263b" roughness={0.64} />
        </mesh>
      )}
      {chest && (
        <mesh position={chest as [number, number, number]} scale={[1.25, 1.12, 0.78]}>
          <sphereGeometry args={[0.13, 24, 18]} />
          <meshStandardMaterial color="#3e87b8" roughness={0.62} />
        </mesh>
      )}
      {head && (
        <group position={head as [number, number, number]}>
          <mesh scale={[0.9, 1.06, 0.9]}>
            <sphereGeometry args={[0.14, 28, 20]} />
            <meshStandardMaterial color="#d79a72" roughness={0.76} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <sphereGeometry args={[0.145, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#211912" roughness={0.88} />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.047, 0.018, 0.123]}>
              <mesh>
                <sphereGeometry args={[0.021, 16, 12]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.35} />
              </mesh>
              <mesh position={[0, 0, 0.018]}>
                <sphereGeometry args={[0.009, 12, 10]} />
                <meshStandardMaterial color="#26384b" roughness={0.3} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.015, 0.132]} scale={[0.55, 0.8, 0.65]}>
            <sphereGeometry args={[0.022, 14, 10]} />
            <meshStandardMaterial color="#c8835e" roughness={0.72} />
          </mesh>
          <mesh position={[0, -0.07, 0.126]} scale={[1, 0.35, 0.35]}>
            <sphereGeometry args={[0.033, 16, 10]} />
            <meshStandardMaterial color="#a64f56" roughness={0.55} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function throwGesturePoints(
  points: number[][],
  frame: number,
  frameCount: number,
  prompt: string,
  basePose: number[][],
) {
  if (!/\b(throw|throws|threw|toss|tosses|tossed)\b/i.test(prompt) || !/\bball\b/i.test(prompt) || !points[0]) {
    return points;
  }

  const stablePose = basePose.length === points.length ? basePose : points;
  const isKimodo = stablePose.length === 77;
  const [shoulderIndex, elbowIndex, wristIndex] = isKimodo ? [39, 41, 42] : [14, 19, 21];
  const shoulder = stablePose[shoulderIndex];
  const elbow = stablePose[elbowIndex];
  const wrist = stablePose[wristIndex];
  if (!shoulder || !elbow || !wrist) return points;

  // Bare throw captions can produce unrelated jumps or twists. Use one
  // stable pose so the performer and ball share the exact same interaction.
  const result = stablePose.map((point) => [...point]);
  const footPairs = isKimodo ? [[69, 70], [74, 75]] : [[7, 10], [8, 11]];
  const forward = footPairs.reduce((sum, [ankleIndex, toeIndex]) => {
    const ankle = stablePose[ankleIndex];
    const toe = stablePose[toeIndex];
    return ankle && toe ? sum.add(new THREE.Vector3(toe[0] - ankle[0], 0, toe[2] - ankle[2])) : sum;
  }, new THREE.Vector3(0, 0, 1));
  if (forward.lengthSq() < 0.0001) forward.set(0, 0, 1);
  forward.normalize();

  const t = frame / Math.max(1, frameCount - 1);
  const smooth = (value: number) => value * value * (3 - 2 * value);
  const blend = (from: number[], to: THREE.Vector3, amount: number) =>
    new THREE.Vector3(from[0], from[1], from[2]).lerp(to, THREE.MathUtils.clamp(amount, 0, 1)).toArray();
  const bend = t < 0.16
    ? 0
    : t < 0.36
      ? smooth((t - 0.16) / 0.2)
      : t < 0.5
        ? 1 - smooth((t - 0.36) / 0.14)
        : 0;
  if (bend > 0) {
    const upperBody = isKimodo
      ? [0, 1, 2, 3, 4, 5, 6, 11, 12, 13, 14, 39, 40, 41, 42]
      : [0, 1, 2, 3, 6, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const knees = isKimodo ? [68, 73] : [4, 5];
    for (const index of upperBody) {
      if (!result[index]) continue;
      result[index][0] += forward.x * 0.16 * bend;
      result[index][1] -= 0.3 * bend;
      result[index][2] += forward.z * 0.16 * bend;
    }
    for (const index of knees) {
      if (!result[index]) continue;
      result[index][0] += forward.x * 0.2 * bend;
      result[index][1] -= 0.06 * bend;
      result[index][2] += forward.z * 0.2 * bend;
    }
  }
  const shoulderPoint = vec(result[shoulderIndex]);
  // Keep the complete throw below shoulder height. The stock avatar has a
  // different shoulder axis than the motion skeleton, so even a modest
  // positive Y offset becomes an unnatural overhead throw after retargeting.
  const windupElbow = shoulderPoint.clone().addScaledVector(forward, -0.16).add(new THREE.Vector3(0, -0.13, 0));
  const windupWrist = shoulderPoint.clone().addScaledVector(forward, -0.34).add(new THREE.Vector3(0, -0.2, 0));
  const releaseElbow = shoulderPoint.clone().addScaledVector(forward, 0.3).add(new THREE.Vector3(0, -0.1, 0));
  const releaseWrist = shoulderPoint.clone().addScaledVector(forward, 0.72).add(new THREE.Vector3(0, -0.05, 0));
  const followElbow = shoulderPoint.clone().addScaledVector(forward, 0.2).add(new THREE.Vector3(0, -0.18, 0));
  const followWrist = shoulderPoint.clone().addScaledVector(forward, 0.5).add(new THREE.Vector3(0, -0.25, 0));
  const floor = Math.min(...stablePose.map((point) => point[1]));
  const pickupGround = vec(result[0]).addScaledVector(forward, 0.34).setY(floor + 0.09);
  const reachElbow = shoulderPoint.clone().addScaledVector(forward, 0.18).add(new THREE.Vector3(0, -0.48, 0));
  const reachWrist = pickupGround.clone().add(new THREE.Vector3(0, 0.04, 0));
  const liftElbow = shoulderPoint.clone().addScaledVector(forward, 0.2).add(new THREE.Vector3(0, -0.18, 0));
  const liftWrist = shoulderPoint.clone().addScaledVector(forward, 0.36).add(new THREE.Vector3(0, -0.3, 0));

  // A text-motion clip frequently assumes the ball is already held. Supply
  // a readable, grounded reach before the throw so the visible interaction
  // always begins with the ball on the floor.
  if (t < 0.16) return result;
  if (t < 0.36) {
    const amount = smooth((t - 0.16) / 0.2);
    result[elbowIndex] = blend(elbow, reachElbow, amount);
    result[wristIndex] = blend(wrist, reachWrist, amount);
  } else if (t < 0.5) {
    const amount = smooth((t - 0.36) / 0.14);
    result[elbowIndex] = reachElbow.lerp(liftElbow, amount).toArray();
    result[wristIndex] = reachWrist.lerp(liftWrist, amount).toArray();
  } else if (t < 0.62) {
    const amount = smooth((t - 0.5) / 0.12);
    result[elbowIndex] = blend(elbow, windupElbow, amount);
    result[wristIndex] = blend(wrist, windupWrist, amount);
  } else if (t < 0.74) {
    const amount = smooth((t - 0.62) / 0.12);
    result[elbowIndex] = windupElbow.lerp(releaseElbow, amount).toArray();
    result[wristIndex] = windupWrist.lerp(releaseWrist, amount).toArray();
  } else if (t < 0.9) {
    const amount = smooth((t - 0.74) / 0.16);
    result[elbowIndex] = releaseElbow.lerp(followElbow, amount).toArray();
    result[wristIndex] = releaseWrist.lerp(followWrist, amount).toArray();
  } else {
    result[elbowIndex] = followElbow.toArray();
    result[wristIndex] = followWrist.toArray();
  }
  return result;
}

function SkinnedHuman({ points, frames, handPositionsRef }: {
  points: number[][];
  frames: number[][][];
  handPositionsRef: MutableRefObject<HandPositions>;
}) {
  const { scene } = useGLTF('/models/human.glb');
  const avatar = useMemo(() => clone(scene), [scene]);
  const rig = useMemo(() => {
    const targets = points.length === 77 ? KIMODO_RIG_TARGETS : HUMAN_RIG_TARGETS;
    const hips = avatar.getObjectByName('Hips') as THREE.Bone;
    const entries = targets.flatMap((target) => {
      const bone = avatar.getObjectByName(target.bone) as THREE.Bone | undefined;
      const child = avatar.getObjectByName(target.child) as THREE.Bone | undefined;
      if (!bone || !child) return [];
      return [{ target, bone, child, rest: bone.quaternion.clone(), childOffset: child.position.clone() }];
    });
    avatar.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const name = node.name.toLowerCase();
        // This GLB uses its outfit meshes as part of the actual torso and leg
        // geometry. Keep every skinned mesh visible, then give all of them a
        // shared matte material so it becomes a complete neutral mannequin.
        node.visible = true;
        const material = new THREE.MeshStandardMaterial({
          color: '#d6d8dc',
          roughness: 0.78,
          metalness: 0.02,
        });
        node.material = material;
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    avatar.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(avatar);
    return { entries, hips: hips.getWorldPosition(new THREE.Vector3()), height: bounds.max.y - bounds.min.y };
  }, [avatar, points.length]);

  useFrame(() => {
    const root = points[0];
    if (!root) return;
    // Use the clip's initial standing pose for scale. The body should bend at
    // the knees during a crouch, not shrink as its bounding box gets shorter.
    const referencePose = frames[0]?.length ? frames[0] : points;
    const height = Math.max(...referencePose.map((point) => point[1])) - Math.min(...referencePose.map((point) => point[1]));
    const scale = THREE.MathUtils.clamp(height / rig.height, 0.84, 1.1);
    const footPairs = points.length === 77 ? [[69, 70], [74, 75]] : [[7, 10], [8, 11]];
    const heading = footPairs.reduce((sum, [ankleIndex, toeIndex]) => {
      const ankle = points[ankleIndex];
      const toe = points[toeIndex];
      return ankle && toe ? sum.add(new THREE.Vector3(toe[0] - ankle[0], 0, toe[2] - ankle[2])) : sum;
    }, new THREE.Vector3());
    if (heading.lengthSq() > 0.0001) {
      avatar.rotation.set(0, Math.atan2(heading.x, heading.z), 0);
    }
    avatar.scale.setScalar(scale);
    const rotatedHips = rig.hips.clone().applyAxisAngle(Y_AXIS, avatar.rotation.y);
    avatar.position.set(root[0] - rotatedHips.x * scale, root[1] - rotatedHips.y * scale, root[2] - rotatedHips.z * scale);
    avatar.updateMatrixWorld(true);

    for (const entry of rig.entries) {
      const from = points[entry.target.from];
      const to = points[entry.target.to];
      if (!from || !to || entry.childOffset.lengthSq() < 0.000001) continue;
      const parentWorld = entry.bone.parent?.getWorldQuaternion(new THREE.Quaternion()) || new THREE.Quaternion();
      const desired = vec(to).sub(vec(from));
      if (desired.lengthSq() < 0.000001) continue;
      const targetInParent = desired.normalize().applyQuaternion(parentWorld.invert());
      const restInParent = entry.childOffset.clone().applyQuaternion(entry.rest).normalize();
      const targetRotation = new THREE.Quaternion()
        .setFromUnitVectors(restInParent, targetInParent)
        .multiply(entry.rest);
      // A joint-position clip does not contain forearm roll. Copying the
      // unconstrained quaternion can make the GLB flip its wrist around the
      // arm axis from one frame to the next. Damping the shortest quaternion
      // path keeps the hand stable while the elbow and wrist still follow the
      // generated throw motion.
      entry.bone.quaternion.slerp(targetRotation, 0.38);
      entry.bone.updateMatrixWorld(true);
    }
    const leftHand = avatar.getObjectByName('LeftHand');
    const rightHand = avatar.getObjectByName('RightHand');
    handPositionsRef.current = [
      leftHand?.getWorldPosition(new THREE.Vector3()) || null,
      rightHand?.getWorldPosition(new THREE.Vector3()) || null,
    ];
  });

  return <primitive object={avatar} />;
}

function InteractionObject({ points, frames, referencePoints, frame, prompt }: {
  points: number[][];
  frames: number[][][];
  referencePoints: number[][];
  frame: number;
  prompt: string;
}) {
  const releasePosition = useRef<THREE.Vector3 | null>(null);
  const previousFrame = useRef(frame);
  const text = prompt.toLowerCase();
  const isPickup = /\b(pick|picks|picked|pick up|pickup|grab|grabs|hold|holds)\b/.test(text) && /\b(object|box|ball|item|something)\b/.test(text);
  const isBallThrow = /\b(throw|throws|threw|toss|tosses|tossed)\b/.test(text) && /\bball\b/.test(text);
  const isThrowAndRetrieve = isBallThrow && isPickup;
  const isKimodo = points.length === 77;
  const handIndices = isKimodo ? KIMODO_HANDS : HUMANML3D_HANDS;
  const pickup = useMemo(() => {
    const sourceFrames = frames.length ? frames : [points];
    const floor = Math.min(...sourceFrames.flatMap((pose) => pose.map((point) => point[1] ?? 0)));
    const searchFrames = Math.max(1, Math.ceil(sourceFrames.length * 0.55));
    let closest = { frame: 0, handIndex: handIndices[0], point: sourceFrames[0]?.[handIndices[0]] || [0, floor, 0], distance: Infinity };

    // Place the object underneath the hand's lowest point in the pickup part
    // of the animation. It means the hand reaches the object before lifting
    // it rather than a world-space box jumping across to the character.
    for (let index = 0; index < searchFrames; index += 1) {
      for (const handIndex of handIndices) {
        const candidate = sourceFrames[index]?.[handIndex];
        if (!candidate) continue;
        const distance = Math.abs(candidate[1] - floor);
        if (distance < closest.distance) {
          closest = { frame: index, handIndex, point: candidate, distance };
        }
      }
    }
    return { ...closest, floor };
  }, [frames, points, handIndices]);

  const throwPlan = useMemo(() => {
    const sourceFrames = referencePoints.length ? [referencePoints] : (frames.length ? frames : [points]);
    const floor = Math.min(...sourceFrames.flatMap((pose) => pose.map((point) => point[1] ?? 0)));
    const throwHandIndex = handIndices[handIndices.length - 1];
    const pickupFrame = Math.max(1, Math.floor(sourceFrames.length * 0.36));
    const releaseFrame = Math.max(pickupFrame + 7, Math.floor(sourceFrames.length * 0.74));
    const retrieveFrame = Math.max(releaseFrame + 8, Math.floor(sourceFrames.length * 0.78));
    const landingFrame = Math.max(releaseFrame + 5, Math.min(retrieveFrame - 2, Math.floor(sourceFrames.length * 0.9)));
    const root = sourceFrames[releaseFrame]?.[0] || [0, floor, 0];
    const footPairs = sourceFrames[releaseFrame]?.length === 77 ? [[69, 70], [74, 75]] : [[7, 10], [8, 11]];
    const heading = footPairs.reduce((sum, [ankleIndex, toeIndex]) => {
      const ankle = sourceFrames[releaseFrame]?.[ankleIndex];
      const toe = sourceFrames[releaseFrame]?.[toeIndex];
      return ankle && toe ? sum.add(new THREE.Vector3(toe[0] - ankle[0], 0, toe[2] - ankle[2])) : sum;
    }, new THREE.Vector3());
    if (heading.lengthSq() < 0.0001) heading.set(0, 0, -1);
    heading.normalize();
    return {
      throwHandIndex,
      pickupFrame,
      // Do not infer pickup height from a model wrist: many generated throw
      // clips only lower the hand to the knee. The prop must begin on ground.
      pickup: [root[0] + heading.x * 0.34, floor + 0.07, root[2] + heading.z * 0.34],
      releaseFrame,
      landingFrame,
      retrieveFrame,
      retrieveHandIndex: handIndices[0],
      launch: sourceFrames[releaseFrame]?.[throwHandIndex] || sourceFrames[0]?.[throwHandIndex] || [0, floor + 1, 0],
      landing: [root[0] + heading.x * 1.05, floor + 0.07, root[2] + heading.z * 1.05],
    };
  }, [frames, points, referencePoints, handIndices]);

  if ((!isPickup && !isBallThrow) || points.length < 22 || !points[0] || !frames[0]?.[0]) return null;

  // The GLB's named hand bones do not always match its visible hand after
  // retargeting. The source wrist is the same endpoint that drives the arm,
  // so using it keeps props at the visible hand instead of the avatar hip.
  const hand = vec(points[pickup.handIndex] || points[handIndices[0]]);
  const ground = new THREE.Vector3(pickup.point[0], pickup.floor + 0.08, pickup.point[2]);
  const held = hand.clone().add(new THREE.Vector3(0, -0.04, 0));
  const liftProgress = Math.min(1, Math.max(0, frame - pickup.frame + 1) / 3);
  let position = frame < pickup.frame ? ground : ground.clone().lerp(held, liftProgress);

  if (isBallThrow) {
    const throwingHand = vec(points[throwPlan.throwHandIndex] || points[handIndices[0]]).add(new THREE.Vector3(0, -0.04, 0));
    const retrieveHand = vec(points[throwPlan.retrieveHandIndex] || points[handIndices[0]]).add(new THREE.Vector3(0, -0.04, 0));
    if (frame < previousFrame.current) releasePosition.current = null;
    if (!releasePosition.current && frame >= throwPlan.releaseFrame) releasePosition.current = throwingHand.clone();
    previousFrame.current = frame;
    const launch = releasePosition.current || throwingHand;
    const landing = launch.clone().lerp(vec(throwPlan.landing), 0.7).setY(throwPlan.landing[1]);
    const pickupGround = vec(throwPlan.pickup);
    if (frame < throwPlan.pickupFrame) {
      position = pickupGround;
    } else if (frame < throwPlan.pickupFrame + 5) {
      position = pickupGround.lerp(throwingHand, (frame - throwPlan.pickupFrame + 1) / 5);
    } else if (frame <= throwPlan.releaseFrame) {
      position = throwingHand;
    } else if (frame <= throwPlan.landingFrame) {
      const progress = (frame - throwPlan.releaseFrame) / Math.max(1, throwPlan.landingFrame - throwPlan.releaseFrame);
      const apex = launch.clone().lerp(landing, 0.5).add(new THREE.Vector3(0, 0.65, 0));
      position = new THREE.QuadraticBezierCurve3(launch, apex, landing).getPoint(progress);
    } else if (!isThrowAndRetrieve || frame < throwPlan.retrieveFrame) {
      position = landing;
    } else {
      // Once pickup starts, keep the prop exactly parented to the rendered
      // hand. The source pose and avatar rig use different bone lengths, so
      // a distance gate leaves the ball behind even while the hand appears
      // to have collected it.
      position = retrieveHand;
    }
  }

  return (
    <group position={position}>
      <mesh castShadow>
        {isBallThrow ? <sphereGeometry args={[0.09, 20, 16]} /> : <boxGeometry args={[0.14, 0.14, 0.14]} />}
        <meshStandardMaterial color={isBallThrow ? "#f06b3c" : "#d58b35"} roughness={0.7} />
      </mesh>
      <pointLight color="#e9a64d" intensity={0.35} distance={0.8} />
    </group>
  );
}

function ChairProp({ points, frames, prompt }: { points: number[][]; frames: number[][][]; prompt: string }) {
  const isChairScene = /\bchair\b/i.test(prompt);
  const chair = useMemo(() => {
    const sourceFrames = frames.length ? frames : [points];
    const poses = sourceFrames.filter((pose) => pose.length > 0);
    if (!poses.length || !poses[0][0]) return null;

    const layout = chairLayout(poses);
    const seatHeight = layout.seatHeight;
    const width = seatHeight * 1.2;
    const depth = width * 0.92;
    const backHeight = seatHeight * 0.92;

    const back = layout.forward.clone().negate();
    return {
      position: layout.position.toArray() as [number, number, number],
      rotation: Math.atan2(back.x, back.z),
      seatHeight,
      width,
      depth,
      backHeight,
    };
  }, [frames, points]);

  if (!isChairScene || !chair) return null;

  const legThickness = chair.width * 0.095;
  const seatThickness = chair.seatHeight * 0.12;
  const backThickness = chair.depth * 0.12;
  const legX = chair.width / 2 - legThickness / 2;
  const legZ = chair.depth / 2 - legThickness / 2;
  const wood = '#8d5a38';
  const cushion = '#a46a42';

  return (
    <group position={chair.position} rotation={[0, chair.rotation, 0]}>
      <mesh position={[0, chair.seatHeight - seatThickness / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[chair.width, seatThickness, chair.depth]} />
        <meshStandardMaterial color={cushion} roughness={0.78} />
      </mesh>
      {[-1, 1].flatMap((x) => [-1, 1].map((z) => (
        <mesh key={`${x}-${z}`} position={[x * legX, chair.seatHeight / 2, z * legZ]} castShadow>
          <boxGeometry args={[legThickness, chair.seatHeight, legThickness]} />
          <meshStandardMaterial color={wood} roughness={0.62} />
        </mesh>
      )))}
      <mesh position={[0, chair.seatHeight + chair.backHeight / 2, chair.depth / 2 - backThickness / 2]} castShadow>
        <boxGeometry args={[chair.width, chair.backHeight, backThickness]} />
        <meshStandardMaterial color={wood} roughness={0.62} />
      </mesh>
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

export function MotionViewer({ frames, frame, fps, prompt = '', bones = DEFAULT_BONES, onResetRef }: Props) {
  const points = frames[Math.min(frame, Math.max(0, frames.length - 1))] || [];
  const positionedPoints = useMemo(() => keepBodyInFrontOfChair(points, frames, prompt, frame), [points, frames, prompt, frame]);
  const displayPoints = useMemo(
    () => seatedChairPoints(positionedPoints, frames, frame, prompt),
    [positionedPoints, frames, frame, prompt],
  );
  const animatedPoints = useMemo(
    () => throwGesturePoints(displayPoints, frame, frames.length, prompt, frames[0] || displayPoints),
    [displayPoints, frame, frames.length, prompt],
  );
  const handPositionsRef = useRef<HandPositions>([null, null]);
  return (
    <div className="relative min-h-[320px] flex-1 overflow-hidden border border-slate-800 bg-[#090d12]">
      <Canvas camera={{ position: [2.2, 1.8, 3.4], fov: 42 }}>
        <color attach="background" args={['#090d12']} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 6, 4]} intensity={1.4} />
        {animatedPoints.length > 0 && (
          <Suspense fallback={<GeneratedBody points={animatedPoints} />}>
            <SkinnedHuman points={animatedPoints} frames={frames} handPositionsRef={handPositionsRef} />
          </Suspense>
        )}
        {points.length > 0 && (
          <InteractionObject
            points={animatedPoints}
            frames={frames}
            referencePoints={frames[0] || animatedPoints}
            frame={frame}
            prompt={prompt}
          />
        )}
        {displayPoints.length > 0 && <ChairProp points={chairAnchorPose(frames.length ? frames : [displayPoints], prompt)} frames={frames} prompt={prompt} />}
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
