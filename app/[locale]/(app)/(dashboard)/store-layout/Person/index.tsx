"use client";

import { type RefObject, useRef } from "react";

import { STORE_LAYOUT_CHARACTERS } from "@/constants/storeLayout";

import { useFrame } from "@react-three/fiber";

import type { Group } from "three";

import type { StoreLayoutCharacter } from "@/types/storeLayout";

const ARM_SWING = 0.6;

const LEG_SWING = 0.6;

const ELBOW_REST = 0.15;

const ELBOW_BEND = 0.5;

const KNEE_BEND = 1.1;

const BOB = 0.03;

const SIDES = [-1, 1] as const;

interface PersonProps {
  character: Extract<StoreLayoutCharacter, "female" | "male">;
  swingRef: RefObject<number>;
}

const Person = ({ character, swingRef }: PersonProps) => {
  const { color, hair, iris, longHair, pants, scale, shoe, skin, skirt, sole } =
    STORE_LAYOUT_CHARACTERS[character];
  const bodyRef = useRef<Group>(null);
  const armRefs = useRef<(Group | null)[]>([]);
  const forearmRefs = useRef<(Group | null)[]>([]);
  const legRefs = useRef<(Group | null)[]>([]);
  const shinRefs = useRef<(Group | null)[]>([]);

  useFrame(() => {
    const swing = swingRef.current;

    if (bodyRef.current) bodyRef.current.position.y = -BOB * Math.abs(swing);

    SIDES.forEach((side, index) => {
      const arm = side * swing * ARM_SWING;
      const leg = -side * swing * LEG_SWING;

      const upperArm = armRefs.current[index];
      const forearm = forearmRefs.current[index];
      const thigh = legRefs.current[index];
      const shin = shinRefs.current[index];

      if (upperArm) upperArm.rotation.x = arm;
      if (forearm)
        forearm.rotation.x = ELBOW_REST + ELBOW_BEND * Math.max(0, arm);
      if (thigh) thigh.rotation.x = leg;
      if (shin) shin.rotation.x = -KNEE_BEND * Math.max(0, -leg);
    });
  });

  return (
    <group scale={scale}>
      <group ref={bodyRef}>
        <mesh position-y={0.9} scale={[0.17, 0.12, 0.1]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        {skirt && (
          <mesh position-y={0.78} scale-z={0.75}>
            <cylinderGeometry args={[0.17, 0.26, 0.32, 24]} />
            <meshStandardMaterial color={skirt} />
          </mesh>
        )}
        <mesh position-y={1.16} scale-z={0.62}>
          <cylinderGeometry args={[0.19, 0.17, 0.48, 20]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position-y={1.4} scale={[0.19, 0.06, 0.118]}>
          <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position-y={1.4} rotation-z={Math.PI / 2} scale-z={0.8}>
          <capsuleGeometry args={[0.09, 0.26, 6, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position-y={1.49}>
          <cylinderGeometry args={[0.05, 0.055, 0.12, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>

        <group position-y={1.63}>
          <mesh scale={[0.92, 1.05, 1]}>
            <sphereGeometry args={[0.12, 24, 16]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          <mesh rotation-x={0.45} scale={[0.95, 1.05, 1.03]}>
            <sphereGeometry
              args={[0.128, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          {longHair && (
            <>
              <mesh position={[0, -0.1, 0.06]} scale={[0.13, 0.2, 0.08]}>
                <sphereGeometry args={[1, 20, 14]} />
                <meshStandardMaterial color={hair} roughness={0.9} />
              </mesh>
              {SIDES.map((side) => (
                <mesh key={side} position={[side * 0.105, -0.08, 0.01]}>
                  <capsuleGeometry args={[0.035, 0.14, 6, 10]} />
                  <meshStandardMaterial color={hair} roughness={0.9} />
                </mesh>
              ))}
            </>
          )}
          <mesh position={[0, -0.025, -0.118]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          {SIDES.map((side) => (
            <group key={side}>
              <mesh position={[side * 0.042, 0.012, -0.108]}>
                <sphereGeometry args={[0.016, 10, 8]} />
                <meshStandardMaterial color={iris} roughness={0.2} />
              </mesh>
              {!longHair && (
                <mesh position-x={side * 0.113} scale={[0.5, 1, 0.8]}>
                  <sphereGeometry args={[0.03, 10, 8]} />
                  <meshStandardMaterial color={skin} />
                </mesh>
              )}
            </group>
          ))}
        </group>

        {SIDES.map((side, index) => (
          <group
            key={`arm:${side}`}
            position={[side * 0.25, 1.4, 0]}
            rotation-z={side * 0.06}
          >
            <group
              ref={(arm) => {
                armRefs.current[index] = arm;
              }}
            >
              <mesh position-y={-0.08}>
                <capsuleGeometry args={[0.066, 0.12, 6, 12]} />
                <meshStandardMaterial color={color} />
              </mesh>
              <mesh position-y={-0.15}>
                <capsuleGeometry args={[0.05, 0.2, 6, 12]} />
                <meshStandardMaterial color={skin} />
              </mesh>
              <group
                position-y={-0.28}
                ref={(forearm) => {
                  forearmRefs.current[index] = forearm;
                }}
              >
                <mesh position-y={-0.12}>
                  <capsuleGeometry args={[0.045, 0.2, 6, 12]} />
                  <meshStandardMaterial color={skin} />
                </mesh>
                <mesh position-y={-0.28} scale={[0.75, 1, 0.55]}>
                  <sphereGeometry args={[0.055, 12, 10]} />
                  <meshStandardMaterial color={skin} />
                </mesh>
              </group>
            </group>
          </group>
        ))}

        {SIDES.map((side, index) => (
          <group
            key={`leg:${side}`}
            position={[side * 0.1, 0.87, 0]}
            ref={(leg) => {
              legRefs.current[index] = leg;
            }}
          >
            <mesh position-y={-0.2}>
              <capsuleGeometry args={[0.078, 0.3, 6, 12]} />
              <meshStandardMaterial color={pants} />
            </mesh>
            <group
              position-y={-0.42}
              ref={(shin) => {
                shinRefs.current[index] = shin;
              }}
            >
              <mesh position-y={-0.18}>
                <capsuleGeometry args={[0.066, 0.3, 6, 12]} />
                <meshStandardMaterial color={pants} />
              </mesh>
              <mesh
                position={[0, -0.39, -0.04]}
                rotation-x={Math.PI / 2}
                scale-x={1.15}
              >
                <capsuleGeometry args={[0.055, 0.15, 6, 12]} />
                <meshStandardMaterial color={shoe} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.43, -0.04]}>
                <boxGeometry args={[0.12, 0.025, 0.26]} />
                <meshStandardMaterial color={sole} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
};

export default Person;
