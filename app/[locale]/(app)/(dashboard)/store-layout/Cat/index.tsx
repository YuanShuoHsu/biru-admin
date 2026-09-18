"use client";

import { type RefObject, useRef } from "react";

import { STORE_LAYOUT_CHARACTERS } from "@/constants/storeLayout";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

const LEG_SWING = 0.6;

const TAIL_SWING = 0.3;

const TAIL_REST = 0.95;

const { belly, fur, iris, nose, stripe } = STORE_LAYOUT_CHARACTERS.cat;

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
  const legRefs = useRef<(Group | null)[]>([]);
  const tailRef = useRef<Group>(null);

  useFrame(() => {
    const swing = swingRef.current;

    LEGS.forEach(({ phase }, index) => {
      const leg = legRefs.current[index];
      if (leg) leg.rotation.x = swing * phase * LEG_SWING;
    });

    if (tailRef.current) tailRef.current.rotation.y = swing * TAIL_SWING;
  });

  return (
    <>
      <mesh position-y={0.3} rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.11, 0.32, 4, 12]} />
        <meshStandardMaterial color={fur} />
      </mesh>
      <mesh position={[0, 0.245, 0.02]} rotation-x={Math.PI / 2}>
        <capsuleGeometry args={[0.085, 0.28, 4, 12]} />
        <meshStandardMaterial color={belly} />
      </mesh>
      {STRIPE_POSITIONS.map((z) => (
        <mesh key={z} position={[0, 0.3, z]}>
          <torusGeometry args={[0.112, 0.012, 6, 16]} />
          <meshStandardMaterial color={stripe} />
        </mesh>
      ))}

      <mesh position={[0, 0.37, -0.29]}>
        <sphereGeometry args={[0.105]} />
        <meshStandardMaterial color={fur} />
      </mesh>
      <mesh position={[0, 0.34, -0.37]}>
        <sphereGeometry args={[0.055]} />
        <meshStandardMaterial color={belly} />
      </mesh>
      <mesh position={[0, 0.355, -0.41]}>
        <sphereGeometry args={[0.018]} />
        <meshStandardMaterial color={nose} />
      </mesh>
      <mesh position={[-0.045, 0.4, -0.37]}>
        <sphereGeometry args={[0.022]} />
        <meshStandardMaterial color={iris} />
      </mesh>
      <mesh position={[0.045, 0.4, -0.37]}>
        <sphereGeometry args={[0.022]} />
        <meshStandardMaterial color={iris} />
      </mesh>
      <mesh position={[-0.06, 0.46, -0.27]} rotation-z={-0.25}>
        <coneGeometry args={[0.045, 0.09, 4]} />
        <meshStandardMaterial color={fur} />
      </mesh>
      <mesh position={[0.06, 0.46, -0.27]} rotation-z={0.25}>
        <coneGeometry args={[0.045, 0.09, 4]} />
        <meshStandardMaterial color={fur} />
      </mesh>
      <mesh position={[0, 0.28, -0.32]}>
        <sphereGeometry args={[0.06]} />
        <meshStandardMaterial color={belly} />
      </mesh>

      {LEGS.map(({ x, z }, index) => (
        <group
          key={`${x}:${z}`}
          position={[x, 0.26, z]}
          ref={(leg) => {
            legRefs.current[index] = leg;
          }}
        >
          <mesh position-y={-0.125}>
            <capsuleGeometry args={[0.042, 0.17, 4, 8]} />
            <meshStandardMaterial color={fur} />
          </mesh>
          <mesh position-y={-0.23}>
            <sphereGeometry args={[0.048]} />
            <meshStandardMaterial color={belly} />
          </mesh>
        </group>
      ))}

      <group position={[0, 0.34, 0.26]} ref={tailRef}>
        <group rotation-x={TAIL_REST}>
          <mesh position-y={0.13}>
            <capsuleGeometry args={[0.026, 0.2, 4, 8]} />
            <meshStandardMaterial color={fur} />
          </mesh>
          <mesh position-y={0.25}>
            <sphereGeometry args={[0.028]} />
            <meshStandardMaterial color={belly} />
          </mesh>
        </group>
      </group>
    </>
  );
};

export default Cat;
