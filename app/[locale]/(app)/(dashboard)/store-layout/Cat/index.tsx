"use client";

import { type ReactNode, type RefObject, useRef } from "react";

import { STORE_LAYOUT_CHARACTERS } from "@/constants/storeLayout";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

const LEG_SWING = 0.6;

const TAIL_SWING = 0.3;

const TAIL_REST = 1.3;

const TAIL_CURL = -0.22;

const TAIL_SEGMENT = 0.09;

const TAIL_SEGMENTS = 4;

const TAIL_SWAY = 0.12;

const TAIL_SWAY_SPEED = 2;

const HEAD_NOD = 0.08;

const BOB = 0.012;

const SIDES = [-1, 1] as const;

const WHISKER_TILTS = [-0.12, 0.1];

const { belly, earInner, fur, iris, nose, pupil, stripe, whisker } =
  STORE_LAYOUT_CHARACTERS.cat;

const STRIPE_POSITIONS = [-0.12, 0, 0.12];

const LEGS = [
  { phase: 1, x: -0.08, z: -0.16 },
  { phase: -1, x: 0.08, z: -0.16 },
  { phase: -1, x: -0.08, z: 0.16 },
  { phase: 1, x: 0.08, z: 0.16 },
] as const;

interface CatProps {
  swingRef: RefObject<number>;
}

const Cat = ({ swingRef }: CatProps) => {
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const legRefs = useRef<(Group | null)[]>([]);
  const tailRefs = useRef<(Group | null)[]>([]);

  useFrame(({ clock }) => {
    const swing = swingRef.current;
    const time = clock.elapsedTime;

    if (bodyRef.current) bodyRef.current.position.y = -BOB * Math.abs(swing);
    if (headRef.current)
      headRef.current.rotation.x = HEAD_NOD * Math.abs(swing);

    LEGS.forEach(({ phase }, index) => {
      const leg = legRefs.current[index];
      if (leg) leg.rotation.x = swing * phase * LEG_SWING;
    });

    tailRefs.current.forEach((segment, index) => {
      if (!segment) return;

      segment.rotation.y =
        (swing * TAIL_SWING) / TAIL_SEGMENTS +
        TAIL_SWAY * Math.sin(time * TAIL_SWAY_SPEED - index * 0.7);
    });
  });

  const tail = Array.from({ length: TAIL_SEGMENTS }).reduceRight<ReactNode>(
    (tip, _, index) => (
      <group
        position-y={index === 0 ? 0 : TAIL_SEGMENT}
        ref={(segment) => {
          tailRefs.current[index] = segment;
        }}
        rotation-x={index === 0 ? 0 : TAIL_CURL}
      >
        <mesh position-y={TAIL_SEGMENT / 2}>
          <capsuleGeometry
            args={[0.028 - index * 0.002, TAIL_SEGMENT, 4, 10]}
          />
          <meshStandardMaterial
            color={index === TAIL_SEGMENTS - 1 ? stripe : fur}
          />
        </mesh>
        {tip}
      </group>
    ),
    null,
  );

  return (
    <group ref={bodyRef}>
      <mesh position-y={0.3} rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.11, 0.32, 6, 16]} />
        <meshStandardMaterial color={fur} />
      </mesh>
      <mesh position={[0, 0.245, 0.02]} rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.085, 0.28, 6, 16]} />
        <meshStandardMaterial color={belly} />
      </mesh>
      {STRIPE_POSITIONS.map((z) => (
        <mesh key={z} position={[0, 0.3, z]}>
          <torusGeometry args={[0.106, 0.009, 6, 20, Math.PI]} />
          <meshStandardMaterial color={stripe} />
        </mesh>
      ))}
      <mesh position={[0, 0.29, -0.24]}>
        <sphereGeometry args={[0.065, 16, 12]} />
        <meshStandardMaterial color={belly} />
      </mesh>

      <group position={[0, 0.4, -0.27]} ref={headRef}>
        <mesh scale={[1.1, 0.95, 1]}>
          <sphereGeometry args={[0.1, 24, 16]} />
          <meshStandardMaterial color={fur} />
        </mesh>
        <mesh position={[0, -0.05, -0.07]}>
          <sphereGeometry args={[0.03, 12, 10]} />
          <meshStandardMaterial color={belly} />
        </mesh>
        <mesh position={[0, -0.013, -0.101]} scale={[1.3, 0.8, 1]}>
          <sphereGeometry args={[0.013, 10, 8]} />
          <meshStandardMaterial color={nose} />
        </mesh>

        {SIDES.map((side) => (
          <group key={side}>
            <mesh position={[side * 0.028, -0.032, -0.08]}>
              <sphereGeometry args={[0.036, 12, 10]} />
              <meshStandardMaterial color={belly} />
            </mesh>

            <mesh position={[side * 0.045, 0.018, -0.083]} scale-z={0.6}>
              <sphereGeometry args={[0.024, 12, 10]} />
              <meshStandardMaterial color={iris} roughness={0.15} />
            </mesh>
            <mesh
              position={[side * 0.045, 0.018, -0.092]}
              scale={[0.3, 0.85, 0.5]}
            >
              <sphereGeometry args={[0.024, 10, 8]} />
              <meshStandardMaterial color={pupil} roughness={0.15} />
            </mesh>
            <mesh position={[side * 0.039, 0.028, -0.1]}>
              <sphereGeometry args={[0.005, 6, 6]} />
              <meshBasicMaterial color={belly} />
            </mesh>

            <group
              position={[side * 0.06, 0.07, 0.005]}
              rotation-z={-side * 0.25}
            >
              <mesh>
                <coneGeometry args={[0.045, 0.09, 4]} />
                <meshStandardMaterial color={fur} />
              </mesh>
              <mesh position={[0, -0.008, -0.012]}>
                <coneGeometry args={[0.028, 0.06, 4]} />
                <meshStandardMaterial color={earInner} />
              </mesh>
            </group>

            {WHISKER_TILTS.map((tilt) => (
              <mesh
                key={tilt}
                position={[side * 0.1, -0.03 + tilt * 0.1, -0.07]}
                rotation={[0, side * 0.3, Math.PI / 2 + side * tilt]}
              >
                <cylinderGeometry args={[0.0018, 0.0018, 0.11, 4]} />
                <meshBasicMaterial color={whisker} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {LEGS.map(({ x, z }, index) => (
        <group
          key={`${x}:${z}`}
          position={[x, 0.26, z]}
          ref={(leg) => {
            legRefs.current[index] = leg;
          }}
        >
          <mesh position-y={-0.125}>
            <capsuleGeometry args={[0.042, 0.17, 4, 10]} />
            <meshStandardMaterial color={fur} />
          </mesh>
          <mesh position={[0, -0.23, -0.01]} scale={[1, 0.7, 1.2]}>
            <sphereGeometry args={[0.048, 12, 10]} />
            <meshStandardMaterial color={belly} />
          </mesh>
        </group>
      ))}

      <group position={[0, 0.33, 0.25]} rotation-x={TAIL_REST}>
        {tail}
      </group>
    </group>
  );
};

export default Cat;
