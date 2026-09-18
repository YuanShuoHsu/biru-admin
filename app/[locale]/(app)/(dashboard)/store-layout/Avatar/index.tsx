"use client";

import { type ComponentRef, type RefObject, useEffect, useRef } from "react";

import {
  STORE_LAYOUT_AVATAR,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_ENTRY,
  STORE_LAYOUT_FLOOR_HEIGHT,
  STORE_LAYOUT_VIEWS,
} from "@/constants/storeLayout";

import { OrbitControls, useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

import { type Group, Vector3 } from "three";

import type { StoreLayoutFloor, StoreLayoutMove } from "@/types/storeLayout";

import Person from "../Person";
import { type AvatarState, advanceAvatar } from "./movement";

const heading = new Vector3();
const followTarget = new Vector3();
const followShift = new Vector3();

const { start } = STORE_LAYOUT_AVATAR;

const { eye, offset } = STORE_LAYOUT_VIEWS.follow;

const FOLLOW_OFFSET = new Vector3(...offset);

const START_POSITION: [number, number, number] = [start.x, 0, start.z];

interface AvatarProps {
  controlsRef: RefObject<ComponentRef<typeof OrbitControls> | null>;
  floor: StoreLayoutFloor;
  follow: boolean;
  onFloorChange: (floor: StoreLayoutFloor) => void;
}

const Avatar = ({ controlsRef, floor, follow, onFloorChange }: AvatarProps) => {
  const groupRef = useRef<Group>(null);
  const floorIndexRef = useRef(0);
  const followingRef = useRef(false);
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

    const controls = follow ? controlsRef.current : null;

    if (!controls) {
      followingRef.current = false;
      return;
    }

    followTarget.set(state.x, state.y + eye, state.z);

    if (followingRef.current)
      // 相機與注視點位移同一個量，軌道半徑與角度才不會被覆寫，使用者轉過的視角得以保留
      controls.object.position.add(
        followShift.subVectors(followTarget, controls.target),
      );
    else controls.object.position.copy(followTarget).add(FOLLOW_OFFSET);

    controls.target.copy(followTarget);
    followingRef.current = true;
  });

  return (
    <group position={START_POSITION} ref={groupRef}>
      <Person color={STORE_LAYOUT_AVATAR.color} />
    </group>
  );
};

export default Avatar;
