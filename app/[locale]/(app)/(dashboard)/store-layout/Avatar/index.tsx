"use client";

import { type ComponentRef, type RefObject, useEffect, useRef } from "react";

import {
  STORE_LAYOUT_AVATAR,
  STORE_LAYOUT_CHARACTERS,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_ENTRY,
  STORE_LAYOUT_LOOK,
  STORE_LAYOUT_VIEWS,
  STORE_LAYOUT_ZOOM_SPEED,
} from "@/constants/storeLayout";

import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

import { type Group, Spherical, Vector3 } from "three";

import type {
  StoreLayoutCharacter,
  StoreLayoutFloor,
  StoreLayoutJump,
  StoreLayoutMove,
  StoreLayoutTouchInput,
  StoreLayoutView,
} from "@/types/storeLayout";

import Cat from "../Cat";
import Dog from "../Dog";
import {
  type ElevatorState,
  advanceElevator,
  elevatorCar,
  elevatorDoors,
} from "../Elevator/motion";
import Person from "../Person";
import {
  type AvatarState,
  advanceAvatar,
  floorIndexAt,
  footholdAt,
  surfaceAt,
} from "./movement";

const reachableCar = (elevator: ElevatorState) =>
  elevator.phase === "moving" ? [] : elevatorCar(elevator);

const heading = new Vector3();
const eyePoint = new Vector3();
const look = new Vector3();
const followShift = new Vector3();
const lookOffset = new Vector3();
const lookSpherical = new Spherical();
const followOffset = new Vector3();

const { jumpSpeed, speed: walkSpeed, sprintSpeed, start } = STORE_LAYOUT_AVATAR;

const SPRINT_FROM = 0.8;

const paceFor = (deflection: number) =>
  deflection <= SPRINT_FROM
    ? walkSpeed
    : walkSpeed +
      ((sprintSpeed - walkSpeed) * (deflection - SPRINT_FROM)) /
        (1 - SPRINT_FROM);

const STRIDE_LENGTH = 0.75;

const RUN_STRIDE_LENGTH = 1.2;

const RUN_DAMPING = 6;

const SWING_DAMPING = 8;

const TURN_SPEED = 12;

const STEP_STIFFNESS = 10;

const MAX_SPRING_STEP = 1 / 30;

const CLIMB_FULL = 0.5;

const CLIMB_DAMPING = 10;

const CLIMB_STRIDE = 0.45;

const TILT_SPAN = 0.2;

const TILT_DAMPING = 10;

const AIR_DAMPING = 14;

const LAND_RECOVERY = 6;

const { speed: lookSpeed } = STORE_LAYOUT_LOOK;

const { lookAhead } = STORE_LAYOUT_VIEWS.first;

const START_POSITION: [number, number, number] = [start.x, 0, start.z];

interface AvatarProps {
  character: StoreLayoutCharacter;
  controlsRef: RefObject<ComponentRef<typeof OrbitControls> | null>;
  elevatorRef: RefObject<ElevatorState>;
  floor: StoreLayoutFloor;
  onFloorChange: (floor: StoreLayoutFloor) => void;
  touchRef: RefObject<StoreLayoutTouchInput>;
  view: StoreLayoutView;
}

const Avatar = ({
  character,
  controlsRef,
  elevatorRef,
  floor,
  onFloorChange,
  touchRef,
  view,
}: AvatarProps) => {
  const groupRef = useRef<Group>(null);
  const previousRef = useRef<{ x: number; y: number; z: number }>({
    x: start.x,
    y: 0,
    z: start.z,
  });
  const stepOffsetRef = useRef(0);
  const stepVelocityRef = useRef(0);
  const climbRef = useRef(0);
  const runRef = useRef(0);
  const jumpRef = useRef<StoreLayoutJump>({ air: 0, land: 0, rise: 0 });
  const tiltRef = useRef<Group>(null);
  const strideRef = useRef(0);
  const swingRef = useRef(0);
  const floorIndexRef = useRef(0);
  const cameraModeRef = useRef<string | null>(null);
  const stateRef = useRef<AvatarState>({
    verticalSpeed: 0,
    x: start.x,
    y: 0,
    z: start.z,
  });
  const groundRef = useRef((right: number, forward: number) => {
    const group = groupRef.current;
    if (!group || stateRef.current.verticalSpeed || elevatorRef.current.riding)
      return 0;

    const { position, rotation } = group;
    const cos = Math.cos(rotation.y);
    const sin = Math.sin(rotation.y);

    return (
      footholdAt(
        position.x + right * cos - forward * sin,
        position.z - right * sin - forward * cos,
        position.y,
        reachableCar(elevatorRef.current),
      ) - position.y
    );
  });
  const { eye, followOffset: characterOffset } =
    STORE_LAYOUT_CHARACTERS[character];
  const camera = useThree((state) => state.camera);
  const [, getMove] = useKeyboardControls<StoreLayoutMove>();

  useEffect(() => {
    const floorIndex = STORE_LAYOUT_FLOORS.indexOf(floor);
    if (floorIndex === floorIndexRef.current) return;

    floorIndexRef.current = floorIndex;

    const entry = STORE_LAYOUT_FLOOR_ENTRY[floor];

    Object.assign(stateRef.current, {
      verticalSpeed: 0,
      x: entry.x,
      y: STORE_LAYOUT_FLOOR_BASE[floor],
      z: entry.z,
    });
    stepOffsetRef.current = 0;
    stepVelocityRef.current = 0;
    previousRef.current.y = STORE_LAYOUT_FLOOR_BASE[floor];
  }, [floor]);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const move = getMove();

    heading.set(0, 0, -1).applyQuaternion(camera.quaternion);
    heading.y = 0;
    if (heading.lengthSq() < 1e-6)
      heading.set(0, 1, 0).applyQuaternion(camera.quaternion).setY(0);
    heading.normalize();

    const state = stateRef.current;

    const touch = touchRef.current;

    const deflection = Math.min(1, Math.hypot(touch.sideways, touch.towards));

    const elevator = elevatorRef.current;
    const lift = advanceElevator(elevator, state, delta);

    if (elevator.riding) state.y += lift;

    const wasAirborne = Boolean(state.verticalSpeed);
    const fallSpeed = state.verticalSpeed;

    const snap = advanceAvatar(
      state,
      {
        forwardX: heading.x,
        forwardZ: heading.z,
        jump: move.jump || touch.jump,
        sideways: Number(move.right) - Number(move.left) + touch.sideways,
        speed: move.sprint ? sprintSpeed : paceFor(deflection),
        towards: Number(move.forward) - Number(move.backward) + touch.towards,
      },
      delta,
      [...elevatorCar(elevator), ...elevatorDoors(elevator)],
    );

    const jump = jumpRef.current;
    const airborne = Boolean(state.verticalSpeed) && !elevator.riding;

    if (wasAirborne && !state.verticalSpeed)
      jump.land = Math.max(jump.land, Math.min(1, -fallSpeed / jumpSpeed));

    jump.land -= jump.land * Math.min(1, delta * LAND_RECOVERY);
    jump.air +=
      (Number(airborne) - jump.air) * Math.min(1, delta * AIR_DAMPING);
    jump.rise = Math.max(-1, Math.min(1, state.verticalSpeed / jumpSpeed));

    if (!elevator.riding) stepOffsetRef.current -= snap;

    const springStep = Math.min(delta, MAX_SPRING_STEP);

    stepVelocityRef.current +=
      (-STEP_STIFFNESS * STEP_STIFFNESS * stepOffsetRef.current -
        2 * STEP_STIFFNESS * stepVelocityRef.current) *
      springStep;
    stepOffsetRef.current += stepVelocityRef.current * springStep;

    const bodyY = state.y + stepOffsetRef.current;

    group.position.set(state.x, bodyY, state.z);

    const stepX = state.x - previousRef.current.x;
    const stepZ = state.z - previousRef.current.z;

    const rise = bodyY - previousRef.current.y;

    previousRef.current.x = state.x;
    previousRef.current.y = bodyY;
    previousRef.current.z = state.z;

    const travelled = Math.hypot(stepX, stepZ);

    const climb =
      travelled > 1e-4 && !elevator.riding
        ? Math.min(1, Math.abs(rise / travelled) / CLIMB_FULL)
        : 0;

    climbRef.current +=
      (climb - climbRef.current) * Math.min(1, delta * CLIMB_DAMPING);

    const run =
      delta > 0
        ? Math.min(
            1,
            Math.max(
              0,
              (travelled / delta - walkSpeed) / (sprintSpeed - walkSpeed),
            ),
          )
        : runRef.current;

    runRef.current += (run - runRef.current) * Math.min(1, delta * RUN_DAMPING);

    if (travelled > 1e-4) {
      strideRef.current +=
        (travelled /
          ((STRIDE_LENGTH +
            (RUN_STRIDE_LENGTH - STRIDE_LENGTH) * runRef.current) *
            (1 - CLIMB_STRIDE * climbRef.current))) *
        Math.PI *
        2;
      swingRef.current = Math.sin(strideRef.current);

      const turn = Math.atan2(-stepX, -stepZ) - group.rotation.y;

      group.rotation.y +=
        Math.atan2(Math.sin(turn), Math.cos(turn)) *
        Math.min(1, delta * TURN_SPEED);
    } else
      swingRef.current -= swingRef.current * Math.min(1, delta * SWING_DAMPING);

    const tilt = tiltRef.current;

    if (tilt) {
      const car = reachableCar(elevator);
      const ahead = -Math.sin(group.rotation.y) * TILT_SPAN;
      const across = -Math.cos(group.rotation.y) * TILT_SPAN;
      const slope =
        state.verticalSpeed || elevator.riding
          ? 0
          : Math.atan2(
              surfaceAt(state.x + ahead, state.z + across, state.y, car) -
                surfaceAt(state.x - ahead, state.z - across, state.y, car),
              2 * TILT_SPAN,
            );

      tilt.rotation.x +=
        (slope - tilt.rotation.x) * Math.min(1, delta * TILT_DAMPING);
    }

    const floorIndex = floorIndexAt(state.y);

    if (floorIndex !== floorIndexRef.current) {
      floorIndexRef.current = floorIndex;
      onFloorChange(STORE_LAYOUT_FLOORS[floorIndex]);
    }

    const controls = controlsRef.current;

    if (controls) {
      const yaw =
        Number(move.lookLeft) - Number(move.lookRight) - touch.lookSideways;
      const pitch =
        Number(move.lookUp) - Number(move.lookDown) + touch.lookVertical;

      if (yaw || pitch) {
        lookOffset.subVectors(controls.object.position, controls.target);
        lookSpherical.setFromVector3(lookOffset);
        lookSpherical.theta += yaw * lookSpeed * delta;
        lookSpherical.phi += pitch * lookSpeed * delta;
        lookSpherical.makeSafe();

        controls.object.position
          .copy(controls.target)
          .add(lookOffset.setFromSpherical(lookSpherical));
      }

      const zoom = Number(move.zoomIn) - Number(move.zoomOut);

      if (zoom)
        controls.dollyIn(Math.exp(-zoom * STORE_LAYOUT_ZOOM_SPEED * delta));
    }

    if (!controls) return;

    if (view !== "first" && view !== "follow") cameraModeRef.current = null;
    else {
      const mode = `${view}:${character}`;
      const entering = cameraModeRef.current !== mode;
      cameraModeRef.current = mode;

      if (view === "first") {
        eyePoint.set(state.x, bodyY + eye, state.z);

        look.subVectors(controls.target, controls.object.position);
        if (entering) look.y = 0;
        if (look.lengthSq() < 1e-6) look.set(0, 0, -1);
        look.normalize();

        controls.object.position.copy(eyePoint);
        controls.target.copy(eyePoint).addScaledVector(look, lookAhead);
      } else {
        eyePoint.set(state.x, bodyY + eye, state.z);

        if (entering)
          controls.object.position
            .copy(eyePoint)
            .add(followOffset.fromArray(characterOffset));
        else
          controls.object.position.add(
            followShift.subVectors(eyePoint, controls.target),
          );

        controls.target.copy(eyePoint);
      }
    }

    // OrbitControls 的 update() 跑在這之前，不補這一下的話這幀會用上一幀的朝向算出畫面
    controls.object.lookAt(controls.target);
  });

  return (
    <group position={START_POSITION} ref={groupRef}>
      {view !== "first" &&
        (character === "cat" || character === "dog" ? (
          <group ref={tiltRef}>
            {character === "cat" ? (
              <Cat jumpRef={jumpRef} runRef={runRef} swingRef={swingRef} />
            ) : (
              <Dog jumpRef={jumpRef} runRef={runRef} swingRef={swingRef} />
            )}
          </group>
        ) : (
          <Person
            character={character}
            climbRef={climbRef}
            groundRef={groundRef}
            jumpRef={jumpRef}
            runRef={runRef}
            swingRef={swingRef}
          />
        ))}
    </group>
  );
};

export default Avatar;
