"use client";

import { useTranslations } from "next-intl";

import {
  STORE_LAYOUT_DOORS,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_KIND_COLORS,
  STORE_LAYOUT_RESTROOMS,
  STORE_LAYOUT_RESTROOM_WALLS,
  STORE_LAYOUT_ROOM,
} from "@/constants/storeLayout";

import { grey } from "@mui/material/colors";

import { Edges, Line } from "@react-three/drei";

import type {
  StoreLayoutFloor,
  StoreLayoutFloorFilter,
} from "@/types/storeLayout";

import SpriteLabel from "../SpriteLabel";
import Surface, { SURFACES } from "../Realistic/Surface";
import { ghostEdge, ghostSurface } from "../ghost";

const WALL_OPACITY = 0.35;
const PATH_LIFT = 0.012;
const LABEL_LIFT = 0.1;

interface Box {
  depth: number;
  elevation: number;
  height: number;
  width: number;
  x: number;
  z: number;
}

const centerOf = (
  floor: StoreLayoutFloor,
  { depth, elevation, height, width, x, z }: Box,
): [number, number, number] => [
  x + width / 2,
  STORE_LAYOUT_FLOOR_BASE[floor] + elevation + height / 2,
  z + depth / 2,
];

interface RestroomsProps {
  floors: StoreLayoutFloorFilter;
  isGhostFloor: (value: StoreLayoutFloor) => boolean;
  realistic: boolean;
  showLabels: boolean;
}

const Restrooms = ({
  floors,
  isGhostFloor,
  realistic,
  showLabels,
}: RestroomsProps) => {
  const tStoreLayout = useTranslations("storeLayout");

  const shows = (floor: StoreLayoutFloor) =>
    floors === "all" || floors === floor;

  return (
    <>
      {STORE_LAYOUT_RESTROOM_WALLS.map((wall) => {
        if (!shows(wall.floor)) return null;

        const ghost = isGhostFloor(wall.floor);

        return (
          <mesh
            key={`${wall.floor}-${wall.x}-${wall.z}-${wall.elevation}`}
            position={centerOf(wall.floor, wall)}
          >
            <boxGeometry args={[wall.width, wall.height, wall.depth]} />
            <meshStandardMaterial
              color={STORE_LAYOUT_KIND_COLORS.restroom}
              depthWrite={false}
              opacity={ghost ? ghostSurface(true).opacity : WALL_OPACITY}
              transparent
            />
            {!realistic && <Edges color={grey[700]} {...ghostEdge(ghost)} />}
          </mesh>
        );
      })}
      {STORE_LAYOUT_DOORS.map(({ leaf, path }) => {
        if (!shows(leaf.floor)) return null;

        const ghost = isGhostFloor(leaf.floor);
        const base = STORE_LAYOUT_FLOOR_BASE[leaf.floor] + PATH_LIFT;

        return (
          <group key={`${leaf.floor}-${leaf.x}-${leaf.z}`}>
            <mesh
              castShadow={realistic && !ghost}
              position={centerOf(leaf.floor, leaf)}
            >
              <boxGeometry args={[leaf.width, leaf.height, leaf.depth]} />
              {realistic ? (
                <Surface ghost={ghost} spec={SURFACES.walnut} />
              ) : (
                <meshStandardMaterial
                  color={STORE_LAYOUT_KIND_COLORS.restroom}
                  {...ghostSurface(ghost)}
                />
              )}
              {!realistic && <Edges color={grey[700]} {...ghostEdge(ghost)} />}
            </mesh>
            {!ghost && (
              <Line
                color={grey[600]}
                dashed
                dashSize={0.06}
                gapSize={0.04}
                lineWidth={1}
                points={path.map(([x, z]) => [x, base, z])}
              />
            )}
          </group>
        );
      })}
      {showLabels &&
        STORE_LAYOUT_FLOORS.map((floor) => {
          if (!shows(floor) || isGhostFloor(floor)) return null;

          return STORE_LAYOUT_RESTROOMS.map(({ depth, label, width, x, z }) => (
            <SpriteLabel
              key={`${floor}-${label}`}
              position={[
                x + width / 2,
                STORE_LAYOUT_FLOOR_BASE[floor] +
                  STORE_LAYOUT_ROOM.height +
                  LABEL_LIFT,
                z + depth / 2,
              ]}
              text={tStoreLayout(`items.${label}`)}
            />
          ));
        })}
    </>
  );
};

export default Restrooms;
