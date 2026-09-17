"use client";

import { useRef } from "react";

import {
  STORE_LAYOUT_AVATAR,
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_ROOM,
} from "@/constants/storeLayout";

import { useKeyboardControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

import { type Group, Vector3 } from "three";

import type { StoreLayoutMove } from "@/types/storeLayout";

import Person from "../Person";

const OBSTACLES = STORE_LAYOUT_ITEMS.filter(({ elevation }) => elevation === 0);

const UP = new Vector3(0, 1, 0);
const heading = new Vector3();
const strafe = new Vector3();

const { gravity, jumpSpeed, radius, speed, start } = STORE_LAYOUT_AVATAR;

const START_POSITION: [number, number, number] = [start.x, 0, start.z];

const clampToRoom = (value: number, size: number) =>
  Math.min(Math.max(value, radius), size - radius);

const isBlocked = (x: number, z: number) =>
  OBSTACLES.some(
    (item) =>
      x + radius > item.x &&
      x - radius < item.x + item.width &&
      z + radius > item.z &&
      z - radius < item.z + item.depth,
  );

const Avatar = () => {
  const groupRef = useRef<Group>(null);
  const verticalSpeedRef = useRef(0);
  const camera = useThree((state) => state.camera);
  const [, getMove] = useKeyboardControls<StoreLayoutMove>();

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const move = getMove();

    const grounded = group.position.y === 0;
    if (grounded && move.jump) verticalSpeedRef.current = jumpSpeed;

    if (!grounded || verticalSpeedRef.current > 0) {
      verticalSpeedRef.current -= gravity * delta;
      const nextY = group.position.y + verticalSpeedRef.current * delta;

      if (nextY > 0) group.position.y = nextY;
      else {
        group.position.y = 0;
        verticalSpeedRef.current = 0;
      }
    }

    const sideways = Number(move.right) - Number(move.left);
    const forwards = Number(move.forward) - Number(move.backward);
    if (!sideways && !forwards) return;

    heading.set(0, 0, -1).applyQuaternion(camera.quaternion);
    heading.y = 0;
    if (heading.lengthSq() < 1e-6)
      heading.set(0, 1, 0).applyQuaternion(camera.quaternion).setY(0);
    heading.normalize();

    strafe.crossVectors(heading, UP);

    heading
      .multiplyScalar(forwards)
      .addScaledVector(strafe, sideways)
      .normalize()
      .multiplyScalar(speed * delta);

    const nextX = clampToRoom(
      group.position.x + heading.x,
      STORE_LAYOUT_ROOM.width,
    );
    const nextZ = clampToRoom(
      group.position.z + heading.z,
      STORE_LAYOUT_ROOM.depth,
    );

    if (!isBlocked(nextX, group.position.z)) group.position.x = nextX;
    if (!isBlocked(group.position.x, nextZ)) group.position.z = nextZ;
  });

  return (
    <group position={START_POSITION} ref={groupRef}>
      <Person color={STORE_LAYOUT_AVATAR.color} />
    </group>
  );
};

export default Avatar;
