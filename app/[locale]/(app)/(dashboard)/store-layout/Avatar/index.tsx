"use client";

import { type ComponentRef, type RefObject, useEffect, useRef } from "react";

import {
  STORE_LAYOUT_AVATAR,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_ENTRY,
  STORE_LAYOUT_LOOK,
  STORE_LAYOUT_VIEWS,
} from "@/constants/storeLayout";

import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

import { type Group, Spherical, Vector3 } from "three";

import type {
  StoreLayoutFloor,
  StoreLayoutMove,
  StoreLayoutTouchInput,
  StoreLayoutView,
} from "@/types/storeLayout";

import Person from "../Person";
import {
  type AvatarState,
  advanceAvatar,
  floorIndexAt,
  isOnStairs,
} from "./movement";

const heading = new Vector3();
const eyePoint = new Vector3();
const look = new Vector3();
const followShift = new Vector3();
const lookOffset = new Vector3();
const lookSpherical = new Spherical();

const { color, skin, start } = STORE_LAYOUT_AVATAR;

const STRIDE_LENGTH = 0.75;

const SWING_DAMPING = 8;

const TURN_SPEED = 12;

const { speed: lookSpeed } = STORE_LAYOUT_LOOK;

const { eye: firstEye, lookAhead } = STORE_LAYOUT_VIEWS.first;
const { eye: followEye, offset } = STORE_LAYOUT_VIEWS.follow;

const FOLLOW_OFFSET = new Vector3(...offset);

const START_POSITION: [number, number, number] = [start.x, 0, start.z];

interface AvatarProps {
  controlsRef: RefObject<ComponentRef<typeof OrbitControls> | null>;
  floor: StoreLayoutFloor;
  onFloorChange: (floor: StoreLayoutFloor) => void;
  onStairsChange: (stairs: boolean) => void;
  touchRef: RefObject<StoreLayoutTouchInput>;
  view: StoreLayoutView;
}

const Avatar = ({
  controlsRef,
  floor,
  onFloorChange,
  onStairsChange,
  touchRef,
  view,
}: AvatarProps) => {
  const groupRef = useRef<Group>(null);
  const previousRef = useRef<{ x: number; z: number }>({
    x: start.x,
    z: start.z,
  });
  const strideRef = useRef(0);
  const swingRef = useRef(0);
  const floorIndexRef = useRef(0);
  const stairsRef = useRef(false);
  const cameraViewRef = useRef<StoreLayoutView | null>(null);
  const stateRef = useRef<AvatarState>({
    verticalSpeed: 0,
    x: start.x,
    y: 0,
    z: start.z,
  });
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

    advanceAvatar(
      state,
      {
        forwardX: heading.x,
        forwardZ: heading.z,
        jump: move.jump || touch.jump,
        sideways: Number(move.right) - Number(move.left) + touch.sideways,
        towards: Number(move.forward) - Number(move.backward) + touch.towards,
      },
      delta,
    );

    group.position.set(state.x, state.y, state.z);

    const stepX = state.x - previousRef.current.x;
    const stepZ = state.z - previousRef.current.z;

    previousRef.current.x = state.x;
    previousRef.current.z = state.z;

    const travelled = Math.hypot(stepX, stepZ);

    if (travelled > 1e-4) {
      strideRef.current += (travelled / STRIDE_LENGTH) * Math.PI * 2;
      swingRef.current = Math.sin(strideRef.current);

      const turn = Math.atan2(-stepX, -stepZ) - group.rotation.y;

      group.rotation.y +=
        Math.atan2(Math.sin(turn), Math.cos(turn)) *
        Math.min(1, delta * TURN_SPEED);
    } else
      swingRef.current -= swingRef.current * Math.min(1, delta * SWING_DAMPING);

    const floorIndex = floorIndexAt(state.y);

    if (floorIndex !== floorIndexRef.current) {
      floorIndexRef.current = floorIndex;
      onFloorChange(STORE_LAYOUT_FLOORS[floorIndex]);
    }

    const stairs = isOnStairs(state.x, state.z);

    if (stairs !== stairsRef.current) {
      stairsRef.current = stairs;
      onStairsChange(stairs);
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
    }

    if (!controls) return;

    if (view !== "first" && view !== "follow") cameraViewRef.current = null;
    else {
      const entering = cameraViewRef.current !== view;
      cameraViewRef.current = view;

      if (view === "first") {
        eyePoint.set(state.x, state.y + firstEye, state.z);

        // 注視點擺在眼前 lookAhead 處，拖曳就是繞著它轉，等同第一人稱的轉頭
        look.subVectors(controls.target, controls.object.position);
        if (entering) look.y = 0;
        if (look.lengthSq() < 1e-6) look.set(0, 0, -1);
        look.normalize();

        controls.object.position.copy(eyePoint);
        controls.target.copy(eyePoint).addScaledVector(look, lookAhead);
      } else {
        eyePoint.set(state.x, state.y + followEye, state.z);

        if (entering)
          controls.object.position.copy(eyePoint).add(FOLLOW_OFFSET);
        // 相機與注視點位移同一個量，軌道半徑與角度才不會被覆寫，使用者轉過的視角得以保留
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
      {view !== "first" && (
        <Person color={color} skin={skin} swingRef={swingRef} />
      )}
    </group>
  );
};

export default Avatar;
