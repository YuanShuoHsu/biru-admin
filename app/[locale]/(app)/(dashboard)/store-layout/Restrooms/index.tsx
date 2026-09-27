"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useRef } from "react";

import {
  STORE_LAYOUT_DOORS,
  STORE_LAYOUT_DOOR_LEAF,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_KIND_COLORS,
  STORE_LAYOUT_RESTROOMS,
  STORE_LAYOUT_RESTROOM_WALLS,
  STORE_LAYOUT_ROOM,
} from "@/constants/storeLayout";

import { grey } from "@mui/material/colors";

import { Edges, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import type { Group, Mesh } from "three";

import type {
  StoreLayoutFloor,
  StoreLayoutFloorFilter,
} from "@/types/storeLayout";

import SpriteLabel from "../SpriteLabel";
import Surface, { SURFACES } from "../Realistic/Surface";
import { ghostEdge, ghostSurface } from "../ghost";
import { doorAngle } from "./motion";

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

type Direction = readonly [number, number];

const yawOf = ([x, z]: Direction) => Math.atan2(-z, x);

const swingYaw = (closed: Direction, open: Direction, openness: number) => {
  const angle = doorAngle(openness);

  return yawOf([
    closed[0] * Math.cos(angle) + open[0] * Math.sin(angle),
    closed[1] * Math.cos(angle) + open[1] * Math.sin(angle),
  ]);
};

const GLASS_FRAME = 0.05;
const GLASS_FRAME_DEPTH = STORE_LAYOUT_DOOR_LEAF + 0.01;

const glassFrame = (
  width: number,
  height: number,
): [number, number, number, number][] => {
  const halfWidth = width / 2 - GLASS_FRAME / 2;
  const halfHeight = height / 2 - GLASS_FRAME / 2;

  return [
    [-halfWidth, 0, GLASS_FRAME, height],
    [halfWidth, 0, GLASS_FRAME, height],
    [0, halfHeight, width, GLASS_FRAME],
    [0, -halfHeight, width, GLASS_FRAME],
  ];
};

interface RestroomsProps {
  doorsRef: RefObject<number[]>;
  floors: StoreLayoutFloorFilter;
  isGhostFloor: (value: StoreLayoutFloor) => boolean;
  realistic: boolean;
  showLabels: boolean;
}

const Restrooms = ({
  doorsRef,
  floors,
  isGhostFloor,
  realistic,
  showLabels,
}: RestroomsProps) => {
  const tStoreLayout = useTranslations("storeLayout");

  const hingeRefs = useRef<(Group | null)[]>([]);
  const leafRefs = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    STORE_LAYOUT_DOORS.forEach(({ closed, open, slide, width }, index) => {
      const openness = doorsRef.current[index];

      if (slide) {
        const leaf = leafRefs.current[index];
        if (leaf) leaf.position.x = width / 2 - width * openness;
        return;
      }

      const hinge = hingeRefs.current[index];
      if (hinge) hinge.rotation.y = swingYaw(closed, open, openness);
    });
  });

  const shows = (floor: StoreLayoutFloor) =>
    floors === "all" || floors === floor;

  return (
    <>
      {STORE_LAYOUT_RESTROOM_WALLS.map((wall) => {
        if (!shows(wall.floor)) return null;

        const ghost = isGhostFloor(wall.floor);

        return (
          <mesh
            castShadow={realistic && !ghost}
            key={`${wall.floor}-${wall.x}-${wall.z}-${wall.elevation}`}
            position={centerOf(wall.floor, wall)}
            receiveShadow={realistic}
          >
            <boxGeometry args={[wall.width, wall.height, wall.depth]} />
            {realistic ? (
              <Surface ghost={ghost} spec={SURFACES.plaster} />
            ) : (
              <meshStandardMaterial
                color={STORE_LAYOUT_KIND_COLORS.restroom}
                depthWrite={false}
                opacity={ghost ? ghostSurface(true).opacity : WALL_OPACITY}
                transparent
              />
            )}
            {!realistic && <Edges color={grey[700]} {...ghostEdge(ghost)} />}
          </mesh>
        );
      })}
      {STORE_LAYOUT_DOORS.map((door, index) => {
        if (!shows(door.floor)) return null;

        const {
          bottom,
          closed,
          floor,
          glass,
          height,
          hinge,
          open,
          path,
          slide,
          width,
        } = door;
        const ghost = isGhostFloor(floor);
        const base = STORE_LAYOUT_FLOOR_BASE[floor];

        return (
          <group key={`${floor}-${hinge.join()}`}>
            <group
              position={[hinge[0], base, hinge[1]]}
              ref={(group) => {
                hingeRefs.current[index] = group;
              }}
              rotation-y={slide ? yawOf(closed) : swingYaw(closed, open, 0)}
            >
              <mesh
                castShadow={realistic && !ghost}
                position={[width / 2, bottom + height / 2, 0]}
                ref={(mesh) => {
                  leafRefs.current[index] = mesh;
                }}
              >
                <boxGeometry args={[width, height, STORE_LAYOUT_DOOR_LEAF]} />
                {realistic ? (
                  <Surface
                    ghost={ghost}
                    spec={glass ? SURFACES.glass : SURFACES.walnut}
                  />
                ) : (
                  <meshStandardMaterial
                    color={
                      glass
                        ? STORE_LAYOUT_KIND_COLORS.front
                        : STORE_LAYOUT_KIND_COLORS.restroom
                    }
                    {...ghostSurface(ghost)}
                  />
                )}
                {!realistic && (
                  <Edges color={grey[700]} {...ghostEdge(ghost)} />
                )}
                {realistic &&
                  glass &&
                  glassFrame(width, height).map(
                    ([x, y, frameWidth, frameHeight]) => (
                      <mesh key={`${x}-${y}`} position={[x, y, 0]}>
                        <boxGeometry
                          args={[frameWidth, frameHeight, GLASS_FRAME_DEPTH]}
                        />
                        <Surface ghost={ghost} spec={SURFACES.blackSteel} />
                      </mesh>
                    ),
                  )}
              </mesh>
            </group>
            {!ghost && (
              <Line
                color={grey[600]}
                dashed
                dashSize={0.06}
                gapSize={0.04}
                lineWidth={1}
                points={path.map(([x, z]) => [x, base + bottom + PATH_LIFT, z])}
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
