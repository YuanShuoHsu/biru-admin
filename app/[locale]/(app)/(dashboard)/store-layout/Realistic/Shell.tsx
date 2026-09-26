"use client";

import { useMemo } from "react";

import {
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_KITCHEN_FLOOR_DEPTH,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SLAB_OPENINGS,
  STORE_LAYOUT_STOREFRONT,
} from "@/constants/storeLayout";

import { Path, Shape, ShapeGeometry } from "three";

import type { StoreLayoutFloor } from "@/types/storeLayout";

import Surface, { SURFACES } from "./Surface";
import { realisticTextures } from "./textures";

const {
  depth: ROOM_DEPTH,
  height: ROOM_HEIGHT,
  width: ROOM_WIDTH,
} = STORE_LAYOUT_ROOM;

const FINISH_LIFT = 0.001;
const CEILING_DROP = 0.002;
const PANE_THICKNESS = 0.02;
const MULLION = 0.05;
const MULLION_SPACING = 1.5;

interface Rect {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

const rectPath = <T extends Path>(
  path: T,
  { bottom, left, right, top }: Rect,
) => {
  path.moveTo(left, bottom);
  path.lineTo(right, bottom);
  path.lineTo(right, top);
  path.lineTo(left, top);
  path.closePath();

  return path;
};

const shapeWithHoles = (outline: Rect, holes: Rect[] = []) => {
  const shape = rectPath(new Shape(), outline);

  shape.holes = holes.map((hole) => rectPath(new Path(), hole));

  return new ShapeGeometry(shape);
};

// 牆面只有正面會畫，法線一律朝室內；從室外看靠近鏡頭的牆會自動透空，走進室內又看得到四面牆
const WALLS = [
  { length: ROOM_WIDTH, position: [0, 0, 0], rotationY: 0 },
  { length: ROOM_DEPTH, position: [0, 0, ROOM_DEPTH], rotationY: Math.PI / 2 },
  { length: ROOM_DEPTH, position: [ROOM_WIDTH, 0, 0], rotationY: -Math.PI / 2 },
] as const;

const FRONT_WALL = {
  position: [ROOM_WIDTH, 0, ROOM_DEPTH],
  rotationY: Math.PI,
} as const;

const OPENINGS = Object.fromEntries(
  STORE_LAYOUT_FLOORS.map((floor) => [
    floor,
    STORE_LAYOUT_STOREFRONT.filter((opening) => opening.floor === floor),
  ]),
) as Record<StoreLayoutFloor, typeof STORE_LAYOUT_STOREFRONT>;

// 地板形狀以 (x, -z) 描點再轉 -90°，法線才會朝上
const footprint = (
  x: number,
  z: number,
  width: number,
  depth: number,
): Rect => ({
  bottom: -(z + depth),
  left: x,
  right: x + width,
  top: -z,
});

// 天花板轉 +90° 讓法線朝下，只有從室內往上看得到，俯瞰時自動透空；這個方向的 z 不用反號
const ceilingFootprint = (
  x: number,
  z: number,
  width: number,
  depth: number,
): Rect => ({
  bottom: z,
  left: x,
  right: x + width,
  top: z + depth,
});

interface ShellProps {
  floor: StoreLayoutFloor;
}

const Shell = ({ floor }: ShellProps) => {
  const openings = OPENINGS[floor];

  const geometries = useMemo(() => {
    const wall = (length: number, holes: Rect[] = []) =>
      shapeWithHoles(
        { bottom: 0, left: 0, right: length, top: ROOM_HEIGHT },
        holes,
      );

    const openingsOnPlan = STORE_LAYOUT_SLAB_OPENINGS.map(
      ({ depth, width, x, z }) => footprint(x, z, width, depth),
    );

    return {
      ceiling: shapeWithHoles(
        ceilingFootprint(0, 0, ROOM_WIDTH, ROOM_DEPTH),
        STORE_LAYOUT_SLAB_OPENINGS.map(({ depth, width, x, z }) =>
          ceilingFootprint(x, z, width, depth),
        ),
      ),
      front: wall(
        ROOM_WIDTH,
        openings.map(({ bottom, from, to, top }) => ({
          bottom,
          left: ROOM_WIDTH - to,
          right: ROOM_WIDTH - from,
          top,
        })),
      ),
      sides: WALLS.map(({ length }) => wall(length)),
      floors:
        floor === "ground"
          ? [
              {
                geometry: shapeWithHoles(
                  footprint(0, 0, ROOM_WIDTH, STORE_LAYOUT_KITCHEN_FLOOR_DEPTH),
                ),
                texture: "tiles" as const,
              },
              {
                geometry: shapeWithHoles(
                  footprint(
                    0,
                    STORE_LAYOUT_KITCHEN_FLOOR_DEPTH,
                    ROOM_WIDTH,
                    ROOM_DEPTH - STORE_LAYOUT_KITCHEN_FLOOR_DEPTH,
                  ),
                ),
                texture: "planks" as const,
              },
            ]
          : [
              {
                geometry: shapeWithHoles(
                  footprint(0, 0, ROOM_WIDTH, ROOM_DEPTH),
                  openingsOnPlan,
                ),
                texture: "planks" as const,
              },
            ],
    };
  }, [floor, openings]);

  const windows = openings.filter(({ kind }) => kind === "window");

  return (
    <>
      {geometries.floors.map(({ geometry, texture }) => (
        <mesh
          geometry={geometry}
          key={texture}
          position-y={FINISH_LIFT}
          receiveShadow
          rotation-x={-Math.PI / 2}
        >
          <meshStandardMaterial
            map={realisticTextures()[texture]}
            roughness={texture === "tiles" ? 0.7 : 0.55}
          />
        </mesh>
      ))}
      <mesh
        geometry={geometries.ceiling}
        position-y={ROOM_HEIGHT - CEILING_DROP}
        rotation-x={Math.PI / 2}
      >
        <Surface spec={SURFACES.plaster} />
      </mesh>
      {WALLS.map(({ position, rotationY }, index) => (
        <mesh
          geometry={geometries.sides[index]}
          key={rotationY}
          position={[...position]}
          receiveShadow
          rotation-y={rotationY}
        >
          <Surface spec={SURFACES.plaster} />
        </mesh>
      ))}
      <mesh
        geometry={geometries.front}
        position={[...FRONT_WALL.position]}
        receiveShadow
        rotation-y={FRONT_WALL.rotationY}
      >
        <Surface spec={SURFACES.plaster} />
      </mesh>
      {windows.map(({ bottom, from, to, top }) => {
        const width = to - from;
        const height = top - bottom;
        const mullions = Math.floor(width / MULLION_SPACING);

        return (
          <group key={from} position={[from, bottom, ROOM_DEPTH]}>
            <mesh position={[width / 2, height / 2, -PANE_THICKNESS]}>
              <boxGeometry args={[width, height, PANE_THICKNESS]} />
              <Surface spec={SURFACES.glass} />
            </mesh>
            {Array.from({ length: mullions + 2 }, (_, index) => (
              <mesh
                key={index}
                position={[
                  (width / (mullions + 1)) * index,
                  height / 2,
                  -PANE_THICKNESS,
                ]}
              >
                <boxGeometry args={[MULLION, height, MULLION]} />
                <Surface spec={SURFACES.blackSteel} />
              </mesh>
            ))}
            {[0, height].map((y) => (
              <mesh key={y} position={[width / 2, y, -PANE_THICKNESS]}>
                <boxGeometry args={[width, MULLION, MULLION]} />
                <Surface spec={SURFACES.blackSteel} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
};

export default Shell;
