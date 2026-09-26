"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

import {
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SEATS,
} from "@/constants/storeLayout";

import {
  DoubleSide,
  type InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";

import type {
  StoreLayoutFloor,
  StoreLayoutFloorFilter,
} from "@/types/storeLayout";

import Surface, { SURFACES } from "./Surface";

type Part = [
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
];

const TOP_THICKNESS = 0.04;
const TABLE_LEG = 0.04;
const TABLE_LEG_INSET = 0.06;
const SEAT_LEG = 0.03;
const SEAT_LEG_INSET = 0.03;

const PENDANT_DROP = 0.8;
const CORD_WIDTH = 0.01;
const SHADE_HEIGHT = 0.18;
const BULB_RADIUS = 0.045;

interface Footprint {
  depth: number;
  width: number;
  x: number;
  z: number;
}

const legs = (
  { depth, width, x, z }: Footprint,
  base: number,
  height: number,
  size: number,
  inset: number,
): Part[] =>
  [
    [x + inset, z + inset],
    [x + width - inset - size, z + inset],
    [x + inset, z + depth - inset - size],
    [x + width - inset - size, z + depth - inset - size],
  ].map(([legX, legZ]) => [
    legX + size / 2,
    base + height / 2,
    legZ + size / 2,
    size,
    height,
    size,
  ]);

const top = ({ depth, width, x, z }: Footprint, surface: number): Part => [
  x + width / 2,
  surface - TOP_THICKNESS / 2,
  z + depth / 2,
  width,
  TOP_THICKNESS,
  depth,
];

const partsOf = (floor: StoreLayoutFloor) => {
  const base = STORE_LAYOUT_FLOOR_BASE[floor];
  const wood: Part[] = [];
  const metal: Part[] = [];
  const pendants: [number, number, number][] = [];

  for (const table of STORE_LAYOUT_ITEMS) {
    if (table.floor !== floor || table.label !== "table") continue;

    const surface = base + table.height;

    wood.push(top(table, surface));
    metal.push(
      ...legs(
        table,
        base,
        table.height - TOP_THICKNESS,
        TABLE_LEG,
        TABLE_LEG_INSET,
      ),
    );
    pendants.push([
      table.x + table.width / 2,
      surface + PENDANT_DROP,
      table.z + table.depth / 2,
    ]);
  }

  for (const part of STORE_LAYOUT_SEATS) {
    if (part.floor !== floor) continue;

    if (part.elevation) {
      wood.push([
        part.x + part.width / 2,
        base + part.elevation + part.height / 2,
        part.z + part.depth / 2,
        part.width,
        part.height,
        part.depth,
      ]);
      continue;
    }

    wood.push(top(part, base + part.height));
    metal.push(
      ...legs(
        part,
        base,
        part.height - TOP_THICKNESS,
        SEAT_LEG,
        SEAT_LEG_INSET,
      ),
    );
  }

  const cords: Part[] = pendants.map(([x, y, z]) => {
    const length = base + STORE_LAYOUT_ROOM.height - y - SHADE_HEIGHT;

    return [
      x,
      y + SHADE_HEIGHT + length / 2,
      z,
      CORD_WIDTH,
      length,
      CORD_WIDTH,
    ];
  });

  return {
    bulbs: pendants.map(([x, y, z]): Part => [x, y + BULB_RADIUS, z, 1, 1, 1]),
    cords,
    metal,
    shades: pendants.map(
      ([x, y, z]): Part => [x, y + SHADE_HEIGHT / 2, z, 1, 1, 1],
    ),
    wood,
  };
};

const PARTS = Object.fromEntries(
  STORE_LAYOUT_FLOORS.map((floor) => [floor, partsOf(floor)]),
) as Record<StoreLayoutFloor, ReturnType<typeof partsOf>>;

const matrix = new Matrix4();
const rotation = new Quaternion();
const position = new Vector3();
const scale = new Vector3();

interface InstancesProps {
  castShadow: boolean;
  children: ReactNode;
  parts: Part[];
}

const Instances = ({ castShadow, children, parts }: InstancesProps) => {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    parts.forEach(([x, y, z, width, height, depth], index) => {
      matrix.compose(
        position.set(x, y, z),
        rotation,
        scale.set(width, height, depth),
      );
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [parts]);

  return (
    <instancedMesh
      args={[undefined, undefined, parts.length]}
      castShadow={castShadow}
      receiveShadow
      ref={ref}
    >
      {children}
    </instancedMesh>
  );
};

interface FurnitureProps {
  floors: StoreLayoutFloorFilter;
  isGhostFloor: (floor: StoreLayoutFloor) => boolean;
}

const Furniture = ({ floors, isGhostFloor }: FurnitureProps) =>
  STORE_LAYOUT_FLOORS.map((floor) => {
    if (floors !== "all" && floors !== floor) return null;

    const ghost = isGhostFloor(floor);
    const { bulbs, cords, metal, shades, wood } = PARTS[floor];

    return (
      <group key={floor}>
        <Instances castShadow={!ghost} parts={wood}>
          <boxGeometry />
          <Surface ghost={ghost} spec={SURFACES.oak} />
        </Instances>
        <Instances castShadow={!ghost} parts={metal}>
          <boxGeometry />
          <Surface ghost={ghost} spec={SURFACES.blackSteel} />
        </Instances>
        {!ghost && (
          <>
            <Instances castShadow={false} parts={cords}>
              <boxGeometry />
              <Surface spec={SURFACES.blackSteel} />
            </Instances>
            <Instances castShadow={false} parts={shades}>
              <cylinderGeometry
                args={[0.06, 0.16, SHADE_HEIGHT, 24, 1, true]}
              />
              <meshStandardMaterial
                color={SURFACES.blackSteel.color}
                metalness={0.5}
                roughness={0.5}
                side={DoubleSide}
              />
            </Instances>
            <Instances castShadow={false} parts={bulbs}>
              <sphereGeometry args={[BULB_RADIUS, 16, 12]} />
              <meshStandardMaterial
                color="#fff3dc"
                emissive="#ffd59a"
                emissiveIntensity={10}
              />
            </Instances>
          </>
        )}
      </group>
    );
  });

export default Furniture;
