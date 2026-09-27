"use client";

import { type RefObject, useRef } from "react";

import { STORE_LAYOUT_CHARACTERS } from "@/constants/storeLayout";

import { useFrame } from "@react-three/fiber";

import { DoubleSide, type Group } from "three";

import type {
  StoreLayoutCharacter,
  StoreLayoutJump,
} from "@/types/storeLayout";

const ARM_SWING = 0.6;

const LEG_SWING = 0.6;

const ELBOW_REST = 0.15;

const ELBOW_BEND = 0.5;

const KNEE_BEND = 1.1;

const BOB = 0.03;

const RUN_ARM_SWING = 0.9;

const RUN_LEG_SWING = 0.85;

const RUN_ELBOW = 1.4;

const RUN_KNEE = 0.35;

const RUN_KICK = 1.4;

const RUN_BOB = 0.05;

const RUN_DIP = 0.03;

const RUN_LEAN = 0.15;

const JUMP_FIST_SIDE = 1;

const JUMP_FIST = 2.9;

const JUMP_FIST_ELBOW = 0.1;

const JUMP_FIST_TILT = 0.15;

const JUMP_DROP_ARM = -0.4;

const JUMP_DROP_SPREAD = 0.45;

const JUMP_KNEE_HIP = 1.45;

const JUMP_KNEE_BEND = -1.7;

const JUMP_REACH_HIP = -0.15;

const JUMP_REACH_KNEE = -0.2;

const JUMP_TOE = 0.35;

const LAND_CROUCH = 0.14;

const LAND_LEAN = 0.25;

const LAND_ARM = 0.5;

const HAIR_FLOAT = 0.5;

const ARM_REST = 0.06;

const HIP_HEIGHT = 0.87;

const STAIR_STRIDE = 0.45;

const THIGH_LENGTH = 0.42;

const SHIN_LENGTH = 0.445;

const LEG_REACH = THIGH_LENGTH + SHIN_LENGTH - 1e-5;

const FOOT_DAMPING = 18;

const ANKLE = 0.4;

const HEEL = -0.09;

const TOE = 0.17;

const HAIR_SWAY = 0.08;

const HAIR_BOUNCE = 0.1;

const BANGS_GAP = 0.12;

const BANGS_WIDTH = 0.8;

const SIDES = [-1, 1] as const;

const FRINGE_WIDTH = 1.5;

const BUILDS = {
  male: {
    arm: 0.052,
    chest: 0.17,
    forearm: 0.05,
    hand: 0.05,
    hipX: 0.1,
    neck: 0.045,
    shin: 0.072,
    shoe: 0.05,
    shoulderLength: 0.26,
    shoulderRadius: 0.072,
    shoulderX: 0.215,
    sleeve: 0.048,
    thigh: 0.074,
    waist: 0.16,
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

const { belt, blush, lips, skirt } = STORE_LAYOUT_CHARACTERS.female;

const { cap, drawstring, pants } = STORE_LAYOUT_CHARACTERS.male;

interface PersonProps {
  character: Extract<StoreLayoutCharacter, "female" | "male">;
  climbRef: RefObject<number>;
  groundRef: RefObject<(right: number, forward: number) => number>;
  jumpRef: RefObject<StoreLayoutJump>;
  runRef: RefObject<number>;
  swingRef: RefObject<number>;
}

const mix = (walk: number, run: number, amount: number) =>
  walk + (run - walk) * amount;

const Person = ({
  character,
  climbRef,
  groundRef,
  jumpRef,
  runRef,
  swingRef,
}: PersonProps) => {
  const { color, hair, iris, scale, shoe, skin, sole } =
    STORE_LAYOUT_CHARACTERS[character];
  const build = BUILDS[character];
  const female = character === "female";
  const legColor = female ? skin : pants;
  const armColor = female ? skin : color;

  const bodyRef = useRef<Group>(null);
  const hairRef = useRef<Group>(null);
  const shoulderRefs = useRef<(Group | null)[]>([]);
  const armRefs = useRef<(Group | null)[]>([]);
  const forearmRefs = useRef<(Group | null)[]>([]);
  const legRefs = useRef<(Group | null)[]>([]);
  const shinRefs = useRef<(Group | null)[]>([]);
  const footRefs = useRef<(Group | null)[]>([]);
  const footholdRefs = useRef([0, 0]);

  useFrame((_state, delta) => {
    const { air, land, rise: lift } = jumpRef.current;
    const swing = swingRef.current * (1 - air);
    const run = runRef.current;
    const lean = RUN_LEAN * run + LAND_LEAN * land;
    const stride = 1 - STAIR_STRIDE * climbRef.current;
    const footholds = footholdRefs.current;

    const strides = SIDES.map((side, index) => {
      const legPhase = -side * swing;
      const hip = legPhase * mix(LEG_SWING, RUN_LEG_SWING, run) * stride;
      const knee = -mix(
        KNEE_BEND * Math.max(0, -hip),
        RUN_KNEE + RUN_KICK * Math.max(0, -legPhase),
        run,
      );
      const forward =
        THIGH_LENGTH * Math.sin(hip) + SHIN_LENGTH * Math.sin(hip + knee);
      const target =
        Math.max(
          groundRef.current(
            side * build.hipX * scale,
            (forward + HEEL) * scale,
          ),
          groundRef.current(side * build.hipX * scale, (forward + TOE) * scale),
        ) / scale;

      footholds[index] +=
        (target - footholds[index]) * Math.min(1, delta * FOOT_DAMPING);

      return {
        drop: THIGH_LENGTH * Math.cos(hip) + SHIN_LENGTH * Math.cos(hip + knee),
        forward,
      };
    });

    // 骨盆跟著較低那隻腳的落點，另一隻腳再彎膝去踩較高的階
    // 落地時骨盆下沉，IK 會自己把膝蓋彎下去接住
    const pelvis = Math.min(...footholds) - LAND_CROUCH * land;

    // 前傾以髖部為軸，否則上半身會整個往前滑出去
    if (bodyRef.current) {
      bodyRef.current.rotation.x = -lean;
      bodyRef.current.position.y =
        mix(-BOB * Math.abs(swing), RUN_BOB * Math.abs(swing) - RUN_DIP, run) +
        HIP_HEIGHT * (1 - Math.cos(lean)) +
        pelvis;
      bodyRef.current.position.z = HIP_HEIGHT * Math.sin(lean);
    }

    if (hairRef.current) {
      hairRef.current.rotation.z = swing * HAIR_SWAY;
      hairRef.current.rotation.x =
        -HAIR_BOUNCE * Math.abs(swing) - HAIR_FLOAT * air * Math.max(0, -lift);
    }

    SIDES.forEach((side, index) => {
      const arm = side * swing * mix(ARM_SWING, RUN_ARM_SWING, run);
      const { drop, forward } = strides[index];
      const rise = drop + pelvis - footholds[index];
      const reach = Math.min(
        LEG_REACH,
        Math.max(1e-3, Math.hypot(forward, rise)),
      );
      const hipOpen = Math.acos(
        Math.min(
          1,
          (THIGH_LENGTH ** 2 + reach ** 2 - SHIN_LENGTH ** 2) /
            (2 * THIGH_LENGTH * reach),
        ),
      );
      const kneeOpen = Math.acos(
        Math.max(
          -1,
          (THIGH_LENGTH ** 2 + SHIN_LENGTH ** 2 - reach ** 2) /
            (2 * THIGH_LENGTH * SHIN_LENGTH),
        ),
      );

      const shoulder = shoulderRefs.current[index];
      const upperArm = armRefs.current[index];
      const forearm = forearmRefs.current[index];
      const thigh = legRefs.current[index];
      const shin = shinRefs.current[index];
      const foot = footRefs.current[index];

      const fist = side === JUMP_FIST_SIDE;

      if (shoulder)
        shoulder.rotation.z =
          side * (ARM_REST + air * (fist ? -JUMP_FIST_TILT : JUMP_DROP_SPREAD));
      if (upperArm)
        upperArm.rotation.x =
          mix(arm, fist ? JUMP_FIST : JUMP_DROP_ARM, air) + LAND_ARM * land;
      if (forearm)
        forearm.rotation.x = mix(
          mix(ELBOW_REST, RUN_ELBOW, run) + ELBOW_BEND * Math.max(0, arm),
          fist ? JUMP_FIST_ELBOW : ELBOW_REST,
          air,
        );
      const stepHip = Math.atan2(forward, rise) + hipOpen + lean;
      const stepKnee = kneeOpen - Math.PI;
      const hipAngle = mix(
        stepHip,
        (fist ? JUMP_REACH_HIP : JUMP_KNEE_HIP) + lean,
        air,
      );
      const kneeAngle = mix(
        stepKnee,
        fist ? JUMP_REACH_KNEE : JUMP_KNEE_BEND,
        air,
      );

      if (thigh) thigh.rotation.x = hipAngle;
      if (shin) shin.rotation.x = kneeAngle;
      // 踩在台階上時腳掌放平，否則腳尖會隨小腿斜插進台階
      if (foot)
        foot.rotation.x =
          (lean - hipAngle - kneeAngle) * climbRef.current - JUMP_TOE * air;
    });
  });

  return (
    <group scale={scale}>
      <group ref={bodyRef}>
        {female ? (
          <>
            <mesh position-y={0.8} scale-z={0.8}>
              <cylinderGeometry args={[0.135, 0.27, 0.38, 18]} />
              <meshStandardMaterial color={skirt} flatShading />
            </mesh>
            <mesh position-y={0.985} rotation-x={Math.PI / 2} scale-y={0.8}>
              <torusGeometry args={[0.136, 0.012, 8, 28]} />
              <meshBasicMaterial color={belt} />
            </mesh>
          </>
        ) : (
          <>
            <mesh position-y={0.9} scale={[0.155, 0.12, 0.095]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={pants} />
            </mesh>
            <mesh position-y={0.88} scale-z={0.66}>
              <cylinderGeometry args={[0.162, 0.178, 0.1, 20]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </>
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
        {!female && (
          <>
            <mesh
              position={[0, 1.35, 0.1]}
              rotation-x={0.08}
              scale={[0.115, 0.11, 0.025]}
            >
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, 1.45, 0.05]} scale={[0.1, 0.04, 0.06]}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {SIDES.map((side) => (
              <mesh key={side} position={[side * 0.035, 1.35, -0.108]}>
                <cylinderGeometry args={[0.005, 0.005, 0.13, 6]} />
                <meshStandardMaterial color={drawstring} />
              </mesh>
            ))}
          </>
        )}
        {female &&
          SIDES.map((side) => (
            <mesh
              key={side}
              position={[side * 0.02, 1.415, -0.105]}
              rotation-z={side * 0.3}
              scale={[0.022, 0.014, 0.008]}
            >
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color={belt} />
            </mesh>
          ))}

        <group position-y={1.63}>
          <mesh scale={[0.92, 1.05, 1]}>
            <sphereGeometry args={[0.12, 24, 16]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          {female && (
            <mesh rotation-x={0.25} scale={[0.95, 1.05, 1.03]}>
              <sphereGeometry
                args={[0.128, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
              />
              <meshStandardMaterial color={hair} roughness={0.9} />
            </mesh>
          )}
          <mesh position={[0, -0.025, -0.118]} scale-y={female ? 1 : 1.4}>
            <sphereGeometry args={[female ? 0.008 : 0.013, 8, 8]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          {!female && (
            <mesh position={[0, -0.052, -0.108]} rotation={[-0.3, 0, Math.PI]}>
              <torusGeometry args={[0.018, 0.003, 6, 16, Math.PI]} />
              <meshStandardMaterial color={iris} />
            </mesh>
          )}

          {!female && (
            <>
              <mesh rotation-x={0.5} scale={[0.95, 1.05, 1.03]}>
                <sphereGeometry
                  args={[0.127, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial color={hair} roughness={0.9} />
              </mesh>
              <mesh scale={[0.95, 1.05, 1.03]}>
                <sphereGeometry
                  args={[
                    0.128,
                    16,
                    6,
                    (Math.PI * 3) / 2 - FRINGE_WIDTH / 2,
                    FRINGE_WIDTH,
                    Math.PI * 0.3,
                    Math.PI * 0.135,
                  ]}
                />
                <meshStandardMaterial
                  color={hair}
                  roughness={0.9}
                  side={DoubleSide}
                />
              </mesh>
              <mesh
                position-y={0.045}
                rotation-x={0.15}
                scale={[0.97, 0.9, 1.03]}
              >
                <sphereGeometry
                  args={[0.136, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
                />
                <meshStandardMaterial color={cap} side={DoubleSide} />
              </mesh>
              <mesh position-y={0.168}>
                <sphereGeometry args={[0.012, 8, 6]} />
                <meshStandardMaterial color={cap} />
              </mesh>
              <mesh
                position={[0, 0.068, -0.14]}
                rotation-x={-0.15}
                scale-z={0.8}
              >
                <cylinderGeometry args={[0.095, 0.095, 0.012, 24]} />
                <meshStandardMaterial color={cap} />
              </mesh>
            </>
          )}

          {female && (
            <>
              <group position={[0, 0.02, 0.04]} ref={hairRef}>
                <mesh position={[0, -0.21, 0.035]} scale={[0.135, 0.28, 0.07]}>
                  <sphereGeometry args={[1, 24, 16]} />
                  <meshStandardMaterial color={hair} roughness={0.8} />
                </mesh>
              </group>
              <mesh position={[0, -0.01, 0.02]} scale={[0.122, 0.13, 0.108]}>
                <sphereGeometry args={[1, 20, 14]} />
                <meshStandardMaterial color={hair} roughness={0.8} />
              </mesh>
              {SIDES.map((side) => (
                <mesh key={side} scale={[0.95, 1.05, 1.03]}>
                  <sphereGeometry
                    args={[
                      0.127,
                      16,
                      6,
                      (Math.PI * 3) / 2 +
                        (side === 1 ? BANGS_GAP / 2 : -BANGS_WIDTH),
                      BANGS_WIDTH - BANGS_GAP / 2,
                      Math.PI * 0.2,
                      Math.PI * 0.2,
                    ]}
                  />
                  <meshStandardMaterial
                    color={hair}
                    roughness={0.8}
                    side={DoubleSide}
                  />
                </mesh>
              ))}
              <mesh position={[0, -0.056, -0.106]} scale={[1, 0.4, 0.5]}>
                <sphereGeometry args={[0.015, 12, 8]} />
                <meshStandardMaterial color={lips} />
              </mesh>
            </>
          )}

          {SIDES.map((side) => (
            <group key={side}>
              <mesh
                position={[side * 0.042, 0.012, -0.108]}
                scale={female ? 1 : [1.35, 0.7, 0.6]}
              >
                <sphereGeometry args={[female ? 0.018 : 0.014, 10, 8]} />
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
                      opacity={0.6}
                      transparent
                    />
                  </mesh>
                  <mesh
                    position={[side * 0.1, -0.15, -0.035]}
                    rotation={[0.3, 0, side * -0.1]}
                    scale={[0.03, 0.2, 0.035]}
                  >
                    <sphereGeometry args={[1, 12, 12]} />
                    <meshStandardMaterial color={hair} roughness={0.8} />
                  </mesh>
                </>
              ) : (
                <mesh position-x={side * 0.11} scale={[0.5, 1, 0.8]}>
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
            ref={(shoulder) => {
              shoulderRefs.current[index] = shoulder;
            }}
            rotation-z={side * ARM_REST}
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
                <meshStandardMaterial color={armColor} />
              </mesh>
              <group
                position-y={-0.28}
                ref={(forearm) => {
                  forearmRefs.current[index] = forearm;
                }}
              >
                <mesh position-y={-0.12}>
                  <capsuleGeometry args={[build.forearm, 0.2, 6, 12]} />
                  <meshStandardMaterial color={armColor} />
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
            position={[side * build.hipX, HIP_HEIGHT, 0]}
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
              <group
                position-y={-ANKLE}
                ref={(foot) => {
                  footRefs.current[index] = foot;
                }}
              >
                <mesh
                  position={[0, ANKLE - 0.445 + build.shoe, -0.04]}
                  rotation-x={Math.PI / 2}
                  scale-x={1.15}
                >
                  <capsuleGeometry args={[build.shoe, 0.15, 6, 12]} />
                  <meshStandardMaterial color={shoe} roughness={0.4} />
                </mesh>
                <mesh position={[0, ANKLE - 0.43, -0.04]}>
                  <boxGeometry args={[build.shoe * 2.2, 0.025, 0.26]} />
                  <meshStandardMaterial color={sole} />
                </mesh>
              </group>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
};

export default Person;
