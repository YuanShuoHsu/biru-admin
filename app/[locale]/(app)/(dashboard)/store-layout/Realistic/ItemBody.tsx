"use client";

import { RoundedBox } from "@react-three/drei";

import type { StoreLayoutItem } from "@/types/storeLayout";

import { ghostSurface } from "../ghost";
import Surface, { SURFACES, surfaceOf } from "./Surface";

const CORNER_RADIUS = 0.02;
const CORNER_SEGMENTS = 2;

const POT_HEIGHT = 0.35;
const LEAF_COLOR = "#4f7a3a";

const FOLIAGE: [number, number, number, number][] = [
  [0, 0.25, 0, 0.3],
  [0.12, 0.45, 0.05, 0.22],
  [-0.1, 0.5, -0.06, 0.2],
  [0.02, 0.68, -0.02, 0.16],
];

interface ItemBodyProps {
  ghost: boolean;
  item: StoreLayoutItem;
}

const Plant = ({ ghost, item }: ItemBodyProps) => {
  const bottom = -item.height / 2;

  return (
    <>
      <mesh castShadow={!ghost} position-y={bottom + POT_HEIGHT / 2}>
        <cylinderGeometry
          args={[item.width * 0.42, item.width * 0.32, POT_HEIGHT, 20]}
        />
        <Surface ghost={ghost} spec={SURFACES.terracotta} />
      </mesh>
      {FOLIAGE.map(([x, y, z, radius]) => (
        <mesh
          castShadow={!ghost}
          key={`${x}-${y}`}
          position={[x, bottom + POT_HEIGHT + y, z]}
        >
          <icosahedronGeometry args={[radius, 1]} />
          <meshStandardMaterial
            color={LEAF_COLOR}
            flatShading
            roughness={0.8}
            {...ghostSurface(ghost)}
          />
        </mesh>
      ))}
    </>
  );
};

const ItemBody = ({ ghost, item }: ItemBodyProps) => {
  if (item.label === "table") return null;

  if (item.label === "plant") return <Plant ghost={ghost} item={item} />;

  const { depth, height, width } = item;

  return (
    <RoundedBox
      args={[width, height, depth]}
      castShadow={!ghost}
      radius={Math.min(CORNER_RADIUS, Math.min(width, height, depth) / 3)}
      receiveShadow
      smoothness={CORNER_SEGMENTS}
    >
      <Surface ghost={ghost} spec={surfaceOf(item)} />
    </RoundedBox>
  );
};

export default ItemBody;
