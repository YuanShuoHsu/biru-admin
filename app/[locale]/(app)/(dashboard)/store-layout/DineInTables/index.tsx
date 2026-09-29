"use client";

import { type RefObject, useRef } from "react";

import {
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_TABLES,
} from "@/constants/storeLayout";

import { useFrame } from "@react-three/fiber";

import type {
  StoreLayoutFloor,
  StoreLayoutFloorFilter,
} from "@/types/storeLayout";

import type { AvatarState } from "../Avatar/movement";

const HALO_MARGIN_X = 0.1;
const HALO_MARGIN_Z = 0.5;
const HALO_LIFT = 0.01;
const HALO_OPACITY = 0.85;
const TABLE_REACH = 1;

const gapAlong = (point: number, from: number, size: number) =>
  Math.max(from - point, 0, point - from - size);

interface DineInTablesProps {
  avatarRef: RefObject<AvatarState>;
  floor: StoreLayoutFloor;
  floors: StoreLayoutFloorFilter;
  isGhostFloor: (value: StoreLayoutFloor) => boolean;
  onNearbyTableChange: (tableNumber: number | null) => void;
  tableColors: Map<number, string>;
}

const DineInTables = ({
  avatarRef,
  floor,
  floors,
  isGhostFloor,
  onNearbyTableChange,
  tableColors,
}: DineInTablesProps) => {
  const nearbyRef = useRef<number | null>(null);

  useFrame(() => {
    const { x: avatarX, z: avatarZ } = avatarRef.current;
    let nearby: number | null = null;
    let nearest = TABLE_REACH;

    for (const table of STORE_LAYOUT_TABLES) {
      if (table.floor !== floor || !tableColors.has(table.tableNumber))
        continue;

      const distance = Math.hypot(
        gapAlong(avatarX, table.x, table.width),
        gapAlong(avatarZ, table.z, table.depth),
      );

      if (distance > nearest) continue;

      nearest = distance;
      nearby = table.tableNumber;
    }

    if (nearby === nearbyRef.current) return;

    nearbyRef.current = nearby;
    onNearbyTableChange(nearby);
  });

  return STORE_LAYOUT_TABLES.map(
    ({ depth, floor: tableFloor, tableNumber, width, x, z }) => {
      const color = tableColors.get(tableNumber);

      if (!color) return null;
      if (floors !== "all" && floors !== tableFloor) return null;
      if (isGhostFloor(tableFloor)) return null;

      const fromX = Math.max(0, x - HALO_MARGIN_X);
      const toX = Math.min(STORE_LAYOUT_ROOM.width, x + width + HALO_MARGIN_X);
      const fromZ = Math.max(0, z - HALO_MARGIN_Z);
      const toZ = Math.min(STORE_LAYOUT_ROOM.depth, z + depth + HALO_MARGIN_Z);

      return (
        <mesh
          key={tableNumber}
          position={[
            (fromX + toX) / 2,
            STORE_LAYOUT_FLOOR_BASE[tableFloor] + HALO_LIFT,
            (fromZ + toZ) / 2,
          ]}
          rotation-x={-Math.PI / 2}
        >
          <planeGeometry args={[toX - fromX, toZ - fromZ]} />
          <meshBasicMaterial
            color={color}
            depthWrite={false}
            opacity={HALO_OPACITY}
            toneMapped={false}
            transparent
          />
        </mesh>
      );
    },
  );
};

export default DineInTables;
