"use client";

import { useMemo } from "react";

import {
  STORE_LAYOUT_DRIVE_THRU,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_KITCHEN_FLOOR_DEPTH,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SLAB_OPENINGS,
  STORE_LAYOUT_STOREFRONT,
} from "@/constants/storeLayout";

import { BackSide, FrontSide, Path, Shape, ShapeGeometry } from "three";

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
const OUTER_SKIN = 0.01;

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

const WALLS = [
  { driveThru: false, length: ROOM_WIDTH, position: [0, 0, 0], rotationY: 0 },
  {
    driveThru: false,
    length: ROOM_DEPTH,
    position: [0, 0, ROOM_DEPTH],
    rotationY: Math.PI / 2,
  },
  {
    driveThru: true,
    length: ROOM_DEPTH,
    position: [ROOM_WIDTH, 0, 0],
    rotationY: -Math.PI / 2,
  },
] as const;

const { window: DRIVE_THRU_WINDOW } = STORE_LAYOUT_DRIVE_THRU;

const DRIVE_THRU_HOLE: Rect = {
  bottom: DRIVE_THRU_WINDOW.bottom,
  left: DRIVE_THRU_WINDOW.from,
  right: DRIVE_THRU_WINDOW.to,
  top: DRIVE_THRU_WINDOW.top,
};

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
  ghost: boolean;
}

const Shell = ({ floor, ghost }: ShellProps) => {
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
      sides: WALLS.map(({ driveThru, length }) =>
        wall(length, driveThru && floor === "ground" ? [DRIVE_THRU_HOLE] : []),
      ),
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
  const enclosed = floor !== "roof";

  return (
    <>
      {!ghost &&
        geometries.floors.map(({ geometry, texture }) => (
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
      {!ghost && enclosed && (
        <mesh
          geometry={geometries.ceiling}
          position-y={ROOM_HEIGHT - CEILING_DROP}
          rotation-x={Math.PI / 2}
        >
          <Surface spec={SURFACES.plaster} />
        </mesh>
      )}
      {enclosed &&
        [
          ...WALLS.map(({ position, rotationY }, index) => ({
            geometry: geometries.sides[index],
            position,
            rotationY,
          })),
          { ...FRONT_WALL, geometry: geometries.front },
        ].map(({ geometry, position, rotationY }) => (
          <group
            key={rotationY}
            position={[...position]}
            rotation-y={rotationY}
          >
            <mesh geometry={geometry} receiveShadow>
              <Surface ghost={ghost} side={FrontSide} spec={SURFACES.plaster} />
            </mesh>
            {/* 外側面往外推，貼牆家具的端面才不會和牆面共面、從室外透出來 */}
            <mesh geometry={geometry} position-z={-OUTER_SKIN} receiveShadow>
              <Surface ghost={ghost} side={BackSide} spec={SURFACES.plaster} />
            </mesh>
          </group>
        ))}
      {windows.map(({ bottom, from, to, top }) => {
        const width = to - from;
        const height = top - bottom;
        const mullions = Math.floor(width / MULLION_SPACING);

        return (
          <group key={from} position={[from, bottom, ROOM_DEPTH]}>
            <mesh position={[width / 2, height / 2, -PANE_THICKNESS]}>
              <boxGeometry args={[width, height, PANE_THICKNESS]} />
              <Surface ghost={ghost} spec={SURFACES.glass} />
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
                <Surface ghost={ghost} spec={SURFACES.blackSteel} />
              </mesh>
            ))}
            {[0, height].map((y) => (
              <mesh key={y} position={[width / 2, y, -PANE_THICKNESS]}>
                <boxGeometry args={[width, MULLION, MULLION]} />
                <Surface ghost={ghost} spec={SURFACES.blackSteel} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
};

export default Shell;
