"use client";

import { type ComponentRef, type RefObject, useEffect, useRef } from "react";

import {
  STORE_LAYOUT_AVATAR,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_ENTRY,
  STORE_LAYOUT_FLOOR_HEIGHT,
  STORE_LAYOUT_LOOK,
  STORE_LAYOUT_VIEWS,
} from "@/constants/storeLayout";

import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

import { type Group, Vector3 } from "three";

import type {
  StoreLayoutFloor,
  StoreLayoutMove,
  StoreLayoutView,
} from "@/types/storeLayout";

import Person from "../Person";
import { type AvatarState, advanceAvatar } from "./movement";

const heading = new Vector3();
const eyePoint = new Vector3();
const look = new Vector3();
const followShift = new Vector3();

const { start } = STORE_LAYOUT_AVATAR;

const { pitchLimit, speed: lookSpeed } = STORE_LAYOUT_LOOK;

const clamp = (value: number, limit: number) =>
  Math.min(Math.max(value, -limit), limit);

const { eye: firstEye, lookAhead } = STORE_LAYOUT_VIEWS.first;
const { eye: followEye, offset } = STORE_LAYOUT_VIEWS.follow;

const FOLLOW_OFFSET = new Vector3(...offset);

const START_POSITION: [number, number, number] = [start.x, 0, start.z];

interface AvatarProps {
  controlsRef: RefObject<ComponentRef<typeof OrbitControls> | null>;
  floor: StoreLayoutFloor;
  onFloorChange: (floor: StoreLayoutFloor) => void;
  view: StoreLayoutView;
}

const Avatar = ({ controlsRef, floor, onFloorChange, view }: AvatarProps) => {
  const groupRef = useRef<Group>(null);
  const floorIndexRef = useRef(0);
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

    advanceAvatar(
      state,
      {
        forwardX: heading.x,
        forwardZ: heading.z,
        jump: move.jump,
        sideways: Number(move.right) - Number(move.left),
        towards: Number(move.forward) - Number(move.backward),
      },
      delta,
    );

    group.position.set(state.x, state.y, state.z);

    const floorIndex = Math.floor(state.y / STORE_LAYOUT_FLOOR_HEIGHT);

    if (floorIndex !== floorIndexRef.current) {
      floorIndexRef.current = floorIndex;
      onFloorChange(STORE_LAYOUT_FLOORS[floorIndex]);
    }

    const controls =
      view === "first" || view === "follow" ? controlsRef.current : null;

    if (!controls) {
      cameraViewRef.current = null;
      return;
    }

    const entering = cameraViewRef.current !== view;
    cameraViewRef.current = view;

    if (view === "first") {
      eyePoint.set(state.x, state.y + firstEye, state.z);

      // 注視點擺在眼前 lookAhead 處，拖曳就是繞著它轉，等同第一人稱的轉頭
      look.subVectors(controls.target, controls.object.position);
      if (entering) look.y = 0;
      if (look.lengthSq() < 1e-6) look.set(0, 0, -1);
      look.normalize();

      const yaw = Number(move.lookLeft) - Number(move.lookRight);
      const pitch = Number(move.lookUp) - Number(move.lookDown);

      if (yaw || pitch) {
        const nextYaw = Math.atan2(look.x, look.z) + yaw * lookSpeed * delta;
        const nextPitch = clamp(
          Math.asin(clamp(look.y, 1)) + pitch * lookSpeed * delta,
          pitchLimit,
        );
        const horizontal = Math.cos(nextPitch);

        look.set(
          Math.sin(nextYaw) * horizontal,
          Math.sin(nextPitch),
          Math.cos(nextYaw) * horizontal,
        );
      }

      controls.object.position.copy(eyePoint);
      controls.target.copy(eyePoint).addScaledVector(look, lookAhead);

      return;
    }

    eyePoint.set(state.x, state.y + followEye, state.z);

    if (entering) controls.object.position.copy(eyePoint).add(FOLLOW_OFFSET);
    // 相機與注視點位移同一個量，軌道半徑與角度才不會被覆寫，使用者轉過的視角得以保留
    else
      controls.object.position.add(
        followShift.subVectors(eyePoint, controls.target),
      );

    controls.target.copy(eyePoint);
  });

  return (
    <group position={START_POSITION} ref={groupRef}>
      {view !== "first" && <Person color={STORE_LAYOUT_AVATAR.color} />}
    </group>
  );
};

export default Avatar;
