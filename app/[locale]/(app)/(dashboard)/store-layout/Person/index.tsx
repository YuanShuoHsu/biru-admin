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

const PONYTAIL_REST = -0.35;

const PONYTAIL_SWAY = 0.3;

const PONYTAIL_BOUNCE = 0.2;

const SIDES = [-1, 1] as const;

const BUILDS = {
  male: {
    arm: 0.05,
    chest: 0.19,
    forearm: 0.045,
    hand: 0.055,
    hipX: 0.1,
    neck: 0.05,
    shin: 0.066,
    shoe: 0.055,
    shoulderLength: 0.26,
    shoulderRadius: 0.09,
    shoulderX: 0.25,
    sleeve: 0.066,
    thigh: 0.078,
    waist: 0.17,
  },
  female: {
    arm: 0.04,
    chest: 0.16,
    forearm: 0.036,
    hand: 0.045,
    hipX: 0.085,
    neck: 0.04,
    shin: 0.05,
    shoe: 0.046,
    shoulderLength: 0.17,
    shoulderRadius: 0.075,
    shoulderX: 0.2,
    sleeve: 0.056,
    thigh: 0.054,
    waist: 0.125,
  },
} as const;

const { blush, bow, lips } = STORE_LAYOUT_CHARACTERS.female;

const { pants } = STORE_LAYOUT_CHARACTERS.male;

interface PersonProps {
  character: Extract<StoreLayoutCharacter, "female" | "male">;
  swingRef: RefObject<number>;
}

const Person = ({ character, swingRef }: PersonProps) => {
  const { color, hair, iris, scale, shoe, skin, sole } =
    STORE_LAYOUT_CHARACTERS[character];
  const build = BUILDS[character];
  const female = character === "female";
  const legColor = female ? skin : pants;

  const bodyRef = useRef<Group>(null);
  const ponytailRef = useRef<Group>(null);
  const armRefs = useRef<(Group | null)[]>([]);
  const forearmRefs = useRef<(Group | null)[]>([]);
  const legRefs = useRef<(Group | null)[]>([]);
  const shinRefs = useRef<(Group | null)[]>([]);

  useFrame(() => {
    const swing = swingRef.current;

    if (bodyRef.current) bodyRef.current.position.y = -BOB * Math.abs(swing);

    if (ponytailRef.current) {
      ponytailRef.current.rotation.z = swing * PONYTAIL_SWAY;
      ponytailRef.current.rotation.x =
        PONYTAIL_REST - PONYTAIL_BOUNCE * Math.abs(swing);
    }

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
        {female ? (
          <>
            <mesh position-y={0.8} scale-z={0.8}>
              <cylinderGeometry args={[0.135, 0.27, 0.38, 28]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position-y={0.985} rotation-x={Math.PI / 2} scale-y={0.8}>
              <torusGeometry args={[0.136, 0.012, 8, 28]} />
              <meshStandardMaterial color={bow} />
            </mesh>
          </>
        ) : (
          <mesh position-y={0.9} scale={[0.17, 0.12, 0.1]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color={pants} />
          </mesh>
        )}
        <mesh position-y={1.16} scale-z={0.62}>
          <cylinderGeometry args={[build.chest, build.waist, 0.48, 20]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position-y={1.4} scale={[build.chest, 0.06, build.chest * 0.62]}>
          <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position-y={1.4} rotation-z={Math.PI / 2} scale-z={0.8}>
          <capsuleGeometry
            args={[build.shoulderRadius, build.shoulderLength, 6, 12]}
          />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position-y={1.49}>
          <cylinderGeometry args={[build.neck, build.neck + 0.005, 0.12, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>

        <group position-y={1.63}>
          <mesh scale={[0.92, 1.05, 1]}>
            <sphereGeometry args={[0.12, 24, 16]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          <mesh rotation-x={female ? 0.25 : 0.45} scale={[0.95, 1.05, 1.03]}>
            <sphereGeometry
              args={[0.128, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.025, -0.118]}>
            <sphereGeometry args={[female ? 0.012 : 0.018, 8, 8]} />
            <meshStandardMaterial color={skin} />
          </mesh>

          {female && (
            <>
              <mesh position={[0, 0, 0.03]} scale={[0.118, 0.13, 0.1]}>
                <sphereGeometry args={[1, 20, 14]} />
                <meshStandardMaterial color={hair} roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.058, -0.104]} scale={[1.3, 0.45, 0.6]}>
                <sphereGeometry args={[0.018, 12, 8]} />
                <meshStandardMaterial color={lips} />
              </mesh>
              <group position={[0, 0.07, 0.1]}>
                {SIDES.map((side) => (
                  <mesh
                    key={side}
                    position-x={side * 0.032}
                    rotation-z={side * 0.3}
                    scale={[0.034, 0.024, 0.012]}
                  >
                    <sphereGeometry args={[1, 12, 10]} />
                    <meshStandardMaterial color={bow} />
                  </mesh>
                ))}
                <mesh>
                  <sphereGeometry args={[0.018, 10, 8]} />
                  <meshStandardMaterial color={bow} />
                </mesh>
                <group ref={ponytailRef}>
                  <mesh position-y={-0.1}>
                    <capsuleGeometry args={[0.042, 0.13, 6, 12]} />
                    <meshStandardMaterial color={hair} roughness={0.9} />
                  </mesh>
                  <mesh position-y={-0.2} rotation-x={Math.PI}>
                    <coneGeometry args={[0.036, 0.08, 12]} />
                    <meshStandardMaterial color={hair} roughness={0.9} />
                  </mesh>
                </group>
              </group>
            </>
          )}

          {SIDES.map((side) => (
            <group key={side}>
              <mesh position={[side * 0.042, 0.012, -0.108]}>
                <sphereGeometry args={[female ? 0.018 : 0.016, 10, 8]} />
                <meshStandardMaterial color={iris} roughness={0.2} />
              </mesh>
              {female ? (
                <>
                  <mesh position={[side * 0.037, 0.018, -0.124]}>
                    <sphereGeometry args={[0.005, 6, 6]} />
                    <meshBasicMaterial color={sole} />
                  </mesh>
                  <mesh
                    position={[side * 0.056, 0.03, -0.1]}
                    rotation={[0, side * 0.5, side * -0.5]}
                  >
                    <boxGeometry args={[0.024, 0.005, 0.006]} />
                    <meshStandardMaterial color={iris} />
                  </mesh>
                  <mesh
                    position={[side * 0.066, -0.022, -0.094]}
                    rotation-y={side * 0.6}
                    scale-z={0.35}
                  >
                    <sphereGeometry args={[0.02, 12, 8]} />
                    <meshStandardMaterial
                      color={blush}
                      opacity={0.8}
                      transparent
                    />
                  </mesh>
                  <mesh
                    position={[side * 0.1, -0.06, -0.01]}
                    rotation-z={side * -0.12}
                    scale={[0.028, 0.1, 0.05]}
                  >
                    <sphereGeometry args={[1, 12, 10]} />
                    <meshStandardMaterial color={hair} roughness={0.9} />
                  </mesh>
                </>
              ) : (
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
            position={[side * build.shoulderX, 1.4, 0]}
            rotation-z={side * 0.06}
          >
            <group
              ref={(arm) => {
                armRefs.current[index] = arm;
              }}
            >
              <mesh position-y={-0.08}>
                <capsuleGeometry args={[build.sleeve, 0.12, 6, 12]} />
                <meshStandardMaterial color={color} />
              </mesh>
              <mesh position-y={-0.15}>
                <capsuleGeometry args={[build.arm, 0.2, 6, 12]} />
                <meshStandardMaterial color={skin} />
              </mesh>
              <group
                position-y={-0.28}
                ref={(forearm) => {
                  forearmRefs.current[index] = forearm;
                }}
              >
                <mesh position-y={-0.12}>
                  <capsuleGeometry args={[build.forearm, 0.2, 6, 12]} />
                  <meshStandardMaterial color={skin} />
                </mesh>
                <mesh position-y={-0.27} scale={[0.75, 1, 0.55]}>
                  <sphereGeometry args={[build.hand, 12, 10]} />
                  <meshStandardMaterial color={skin} />
                </mesh>
              </group>
            </group>
          </group>
        ))}

        {SIDES.map((side, index) => (
          <group
            key={`leg:${side}`}
            position={[side * build.hipX, 0.87, 0]}
            ref={(leg) => {
              legRefs.current[index] = leg;
            }}
          >
            <mesh position-y={-0.2}>
              <capsuleGeometry args={[build.thigh, 0.3, 6, 12]} />
              <meshStandardMaterial color={legColor} />
            </mesh>
            <group
              position-y={-0.42}
              ref={(shin) => {
                shinRefs.current[index] = shin;
              }}
            >
              <mesh position-y={-0.18}>
                <capsuleGeometry args={[build.shin, 0.3, 6, 12]} />
                <meshStandardMaterial color={legColor} />
              </mesh>
              <mesh
                position={[0, -0.445 + build.shoe, -0.04]}
                rotation-x={Math.PI / 2}
                scale-x={1.15}
              >
                <capsuleGeometry args={[build.shoe, 0.15, 6, 12]} />
                <meshStandardMaterial color={shoe} roughness={0.4} />
              </mesh>
              <mesh position={[0, -0.43, -0.04]}>
                <boxGeometry args={[build.shoe * 2.2, 0.025, 0.26]} />
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
