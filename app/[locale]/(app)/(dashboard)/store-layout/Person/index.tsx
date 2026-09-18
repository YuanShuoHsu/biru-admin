"use client";

import { type RefObject, useRef } from "react";

import { STORE_LAYOUT_CHARACTERS } from "@/constants/storeLayout";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

const ARM_SWING = 0.7;

const LEG_SWING = 0.85;

const { color, skin } = STORE_LAYOUT_CHARACTERS.person;

interface PersonProps {
  swingRef: RefObject<number>;
}

const Person = ({ swingRef }: PersonProps) => {
  const leftArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);

  useFrame(() => {
    const swing = swingRef.current;

    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * ARM_SWING;
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * ARM_SWING;
    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * LEG_SWING;
    if (rightLegRef.current)
      rightLegRef.current.rotation.x = -swing * LEG_SWING;
  });

  return (
    <>
      <mesh position-y={1.12}>
        <boxGeometry args={[0.42, 0.6, 0.24]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position-y={1.58}>
        <sphereGeometry args={[0.13]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      <group position={[-0.27, 1.36, 0]} ref={leftArmRef}>
        <mesh position-y={-0.29}>
          <capsuleGeometry args={[0.06, 0.46, 4, 8]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
      <group position={[0.27, 1.36, 0]} ref={rightArmRef}>
        <mesh position-y={-0.29}>
          <capsuleGeometry args={[0.06, 0.46, 4, 8]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
      <group position={[-0.11, 0.82, 0]} ref={leftLegRef}>
        <mesh position-y={-0.41}>
          <capsuleGeometry args={[0.08, 0.66, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
      <group position={[0.11, 0.82, 0]} ref={rightLegRef}>
        <mesh position-y={-0.41}>
          <capsuleGeometry args={[0.08, 0.66, 4, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    </>
  );
};

export default Person;
