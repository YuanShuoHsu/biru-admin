"use client";

import { RoundedBox, useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { Material, Mesh } from "three";

import type { StoreLayoutItem } from "@/types/storeLayout";

import { ghostSurface } from "../ghost";
import Surface, { SURFACES, surfaceOf } from "./Surface";

const CORNER_RADIUS = 0.02;
const CORNER_SEGMENTS = 2;

const MODELS: Partial<Record<StoreLayoutItem["label"], string>> = {
  grinder: "/models/grinder.glb",
  iceMachine: "/models/iceMachine.glb",
  kettle: "/models/kettle.glb",
  microwave: "/models/microwave.glb",
};

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

const Block = ({ ghost, item }: ItemBodyProps) => {
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

const SOIL_INSET = 0.08;
const SOIL_LIFT = 0.002;
const SOIL_COLOR = "#4a3726";
const SHRUB_SPACING = 0.6;
const SHRUB_RADIUS = 0.3;

const Planter = ({ ghost, item }: ItemBodyProps) => {
  const { depth, height, width } = item;
  const long = Math.max(width, depth);
  const shrubs = Math.max(1, Math.floor(long / SHRUB_SPACING));
  const top = height / 2 + SOIL_LIFT;

  return (
    <>
      <Block ghost={ghost} item={item} />
      <mesh position-y={top} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[width - SOIL_INSET, depth - SOIL_INSET]} />
        <meshStandardMaterial
          color={SOIL_COLOR}
          roughness={1}
          {...ghostSurface(ghost)}
        />
      </mesh>
      {Array.from({ length: shrubs }, (_, index) => {
        const along = (long / shrubs) * (index + 0.5) - long / 2;
        const radius = SHRUB_RADIUS * (index % 2 ? 0.8 : 1);

        return (
          <mesh
            castShadow={!ghost}
            key={index}
            position={[
              width >= depth ? along : 0,
              top + radius * 0.6,
              width >= depth ? 0 : along,
            ]}
          >
            <icosahedronGeometry args={[radius, 1]} />
            <meshStandardMaterial
              color={LEAF_COLOR}
              flatShading
              roughness={0.8}
              {...ghostSurface(ghost)}
            />
          </mesh>
        );
      })}
    </>
  );
};

interface ModelProps extends ItemBodyProps {
  url: string;
}

const Model = ({ ghost, item, url }: ModelProps) => {
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const clone = scene.clone();

    clone.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      object.castShadow = !ghost;
      object.receiveShadow = true;

      if (ghost && object.material instanceof Material)
        object.material = Object.assign(
          object.material.clone(),
          ghostSurface(true),
        );
    });

    return clone;
  }, [ghost, scene]);

  return <primitive object={model} position-y={-item.height / 2} />;
};

const ItemBody = ({ ghost, item }: ItemBodyProps) => {
  if (item.label === "table") return null;

  const url = MODELS[item.label];

  if (url)
    return (
      <Suspense fallback={<Block ghost={ghost} item={item} />}>
        <Model ghost={ghost} item={item} url={url} />
      </Suspense>
    );

  if (item.label === "plant") return <Plant ghost={ghost} item={item} />;

  if (item.label === "planter") return <Planter ghost={ghost} item={item} />;

  return <Block ghost={ghost} item={item} />;
};

export default ItemBody;
