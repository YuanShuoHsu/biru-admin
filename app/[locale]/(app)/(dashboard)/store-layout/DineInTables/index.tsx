"use client";

import { useState } from "react";

import {
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_TABLES,
} from "@/constants/storeLayout";

import { useCursor } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";

import type {
  StoreLayoutFloor,
  StoreLayoutFloorFilter,
} from "@/types/storeLayout";

const HALO_MARGIN_X = 0.1;
const HALO_MARGIN_Z = 0.5;
const HALO_LIFT = 0.01;
const HALO_OPACITY = 0.85;
const CLICK_TOLERANCE = 4;

interface DineInTablesProps {
  floors: StoreLayoutFloorFilter;
  isGhostFloor: (value: StoreLayoutFloor) => boolean;
  onSelect: (tableNumber: number) => void;
  tableColors: Map<number, string>;
}

const DineInTables = ({
  floors,
  isGhostFloor,
  onSelect,
  tableColors,
}: DineInTablesProps) => {
  const [hovered, setHovered] = useState(false);

  useCursor(hovered);

  return STORE_LAYOUT_TABLES.map(
    ({ depth, floor, tableNumber, width, x, z }) => {
      const color = tableColors.get(tableNumber);

      if (!color) return null;
      if (floors !== "all" && floors !== floor) return null;
      if (isGhostFloor(floor)) return null;

      const fromX = Math.max(0, x - HALO_MARGIN_X);
      const toX = Math.min(STORE_LAYOUT_ROOM.width, x + width + HALO_MARGIN_X);
      const fromZ = Math.max(0, z - HALO_MARGIN_Z);
      const toZ = Math.min(STORE_LAYOUT_ROOM.depth, z + depth + HALO_MARGIN_Z);

      // 拖曳旋轉視角放開時也會觸發 click，位移超過容許值就不當成點選
      const handleClick = (event: ThreeEvent<MouseEvent>) => {
        if (event.delta > CLICK_TOLERANCE) return;

        event.stopPropagation();
        onSelect(tableNumber);
      };

      return (
        <mesh
          key={tableNumber}
          onClick={handleClick}
          onPointerOut={() => setHovered(false)}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
          }}
          position={[
            (fromX + toX) / 2,
            STORE_LAYOUT_FLOOR_BASE[floor] + HALO_LIFT,
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
