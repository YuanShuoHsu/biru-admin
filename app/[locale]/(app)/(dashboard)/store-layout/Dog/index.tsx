"use client";

import { type ReactNode, type RefObject, useRef } from "react";

import { STORE_LAYOUT_CHARACTERS } from "@/constants/storeLayout";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

import type { StoreLayoutJump } from "@/types/storeLayout";

const LEG_SWING = 0.6;

const TAIL_REST = 0.5;

const TAIL_CURL = -0.3;

const TAIL_SEGMENT = 0.08;

const TAIL_SEGMENTS = 3;

const WAG = 0.35;

const WAG_SPEED = 10;

const HEAD_NOD = 0.08;

const RUN_LEG_SWING = 0.9;

const RUN_BOB = 0.04;

const RUN_PITCH = 0.12;

const JUMP_PITCH = 0.35;

const JUMP_FRONT = [0.3, 0.9] as const;

const JUMP_HIND = [0.25, -0.8] as const;

const LAND_SQUASH = 0.05;

const LAND_NOD = 0.25;

const BOB = 0.015;

const SIDES = [-1, 1] as const;

const { belly, collar, ear, fur, iris, nose, tag, tongue } =
  STORE_LAYOUT_CHARACTERS.dog;

const LEGS = [
  { gallop: 1, phase: 1, x: -0.09, z: -0.2 },
  { gallop: 1, phase: -1, x: 0.09, z: -0.2 },
  { gallop: -1, phase: -1, x: -0.09, z: 0.2 },
  { gallop: -1, phase: 1, x: 0.09, z: 0.2 },
] as const;

interface DogProps {
  jumpRef: RefObject<StoreLayoutJump>;
  runRef: RefObject<number>;
  swingRef: RefObject<number>;
}

const mix = (walk: number, run: number, amount: number) =>
  walk + (run - walk) * amount;

const Dog = ({ jumpRef, runRef, swingRef }: DogProps) => {
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const legRefs = useRef<(Group | null)[]>([]);
  const tailRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const { air, land, rise } = jumpRef.current;
    const swing = swingRef.current * (1 - air);
    const arc = (rise + 1) / 2;

    const run = runRef.current;

    if (bodyRef.current) {
      bodyRef.current.position.y =
        mix(-BOB, RUN_BOB, run) * Math.abs(swing) - LAND_SQUASH * land;
      bodyRef.current.rotation.x =
        RUN_PITCH * run * swing + JUMP_PITCH * air * rise;
    }
    if (headRef.current)
      headRef.current.rotation.x = HEAD_NOD * Math.abs(swing) + LAND_NOD * land;

    LEGS.forEach(({ gallop, phase }, index) => {
      const leg = legRefs.current[index];
      const [falling, rising] = gallop > 0 ? JUMP_FRONT : JUMP_HIND;

      if (leg)
        leg.rotation.x =
          swing * mix(phase, gallop, run) * mix(LEG_SWING, RUN_LEG_SWING, run) +
          air * mix(falling, rising, arc);
    });

    if (tailRef.current)
      tailRef.current.rotation.z =
        WAG * Math.sin(clock.elapsedTime * WAG_SPEED);
  });

  const tail = Array.from({ length: TAIL_SEGMENTS }).reduceRight<ReactNode>(
    (tip, _, index) => (
      <group
        position-y={index === 0 ? 0 : TAIL_SEGMENT}
        rotation-x={index === 0 ? 0 : TAIL_CURL}
      >
        <mesh position-y={TAIL_SEGMENT / 2}>
          <capsuleGeometry
            args={[0.032 - index * 0.004, TAIL_SEGMENT, 4, 10]}
          />
          <meshStandardMaterial
            color={index === TAIL_SEGMENTS - 1 ? belly : fur}
          />
        </mesh>
        {tip}
      </group>
    ),
    null,
  );

  return (
    <group ref={bodyRef}>
      <mesh position-y={0.4} rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.13, 0.38, 6, 16]} />
        <meshStandardMaterial color={fur} />
      </mesh>
      <mesh position={[0, 0.35, 0.02]} rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.1, 0.32, 6, 16]} />
        <meshStandardMaterial color={belly} />
      </mesh>
      <mesh position={[0, 0.4, -0.25]}>
        <sphereGeometry args={[0.085, 16, 12]} />
        <meshStandardMaterial color={belly} />
      </mesh>

      <group position={[0, 0.48, -0.31]} rotation-x={Math.PI / 2 - 0.5}>
        <mesh>
          <torusGeometry args={[0.088, 0.016, 8, 24]} />
          <meshStandardMaterial color={collar} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.006, 12]} />
          <meshStandardMaterial color={tag} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      <group position={[0, 0.55, -0.33]} ref={headRef}>
        <mesh scale={[1, 0.95, 1.05]}>
          <sphereGeometry args={[0.12, 24, 16]} />
          <meshStandardMaterial color={fur} />
        </mesh>
        <mesh position={[0, -0.035, -0.12]} rotation-x={Math.PI / 2}>
          <capsuleGeometry args={[0.055, 0.06, 6, 12]} />
          <meshStandardMaterial color={belly} />
        </mesh>
        <mesh position={[0, -0.015, -0.2]} scale={[1.3, 0.9, 1]}>
          <sphereGeometry args={[0.025, 12, 10]} />
          <meshStandardMaterial color={nose} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.085, -0.17]} scale={[1, 0.35, 1.2]}>
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color={tongue} />
        </mesh>

        {SIDES.map((side) => (
          <group key={side}>
            <mesh position={[side * 0.05, 0.03, -0.1]}>
              <sphereGeometry args={[0.02, 12, 10]} />
              <meshStandardMaterial color={iris} roughness={0.15} />
            </mesh>
            <mesh position={[side * 0.045, 0.04, -0.118]}>
              <sphereGeometry args={[0.006, 6, 6]} />
              <meshBasicMaterial color={belly} />
            </mesh>
            <group position={[side * 0.09, 0.07, 0]} rotation-z={side * 0.35}>
              <mesh position-y={-0.06} scale={[0.03, 0.09, 0.06]}>
                <sphereGeometry args={[1, 12, 10]} />
                <meshStandardMaterial color={ear} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {LEGS.map(({ x, z }, index) => (
        <group
          key={`${x}:${z}`}
          position={[x, 0.32, z]}
          ref={(leg) => {
            legRefs.current[index] = leg;
          }}
        >
          <mesh position-y={-0.14}>
            <capsuleGeometry args={[0.05, 0.2, 4, 10]} />
            <meshStandardMaterial color={fur} />
          </mesh>
          <mesh position={[0, -0.28, -0.01]} scale={[1, 0.7, 1.2]}>
            <sphereGeometry args={[0.055, 12, 10]} />
            <meshStandardMaterial color={belly} />
          </mesh>
        </group>
      ))}

      <group position={[0, 0.45, 0.3]} rotation-x={TAIL_REST}>
        <group ref={tailRef}>{tail}</group>
      </group>
    </group>
  );
};

export default Dog;
