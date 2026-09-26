"use client";

import { grey } from "@mui/material/colors";

import type { StoreLayoutItem } from "@/types/storeLayout";

import { ghostSurface } from "../ghost";
import { realisticTextures } from "./textures";

interface SurfaceSpec {
  color: string;
  emissive?: string;
  glass?: boolean;
  metalness?: number;
  roughness: number;
  wood?: boolean;
}

export const SURFACES = {
  blackSteel: { color: grey[900], metalness: 0.6, roughness: 0.45 },
  chalk: { color: "#1f2421", roughness: 0.95 },
  coir: { color: "#3b352f", roughness: 1 },
  glass: { color: "#dcecef", glass: true, roughness: 0.05 },
  oak: { color: "#ffffff", roughness: 0.6, wood: true },
  plaster: { color: "#ece7df", roughness: 0.9 },
  screen: { color: "#101418", emissive: "#1e3a4f", roughness: 0.2 },
  stainless: { color: grey[300], metalness: 0.85, roughness: 0.28 },
  terracotta: { color: "#b5643c", roughness: 0.85 },
  walnut: { color: "#8a6446", roughness: 0.55, wood: true },
} as const satisfies Record<string, SurfaceSpec>;

type Kind = StoreLayoutItem["kind"];
type Label = StoreLayoutItem["label"];

const BY_KIND: Record<Kind, SurfaceSpec> = {
  bar: SURFACES.stainless,
  cold: SURFACES.stainless,
  equipment: SURFACES.stainless,
  front: SURFACES.walnut,
  heat: SURFACES.stainless,
  plant: SURFACES.terracotta,
  prep: SURFACES.stainless,
  restroom: SURFACES.plaster,
  seat: SURFACES.oak,
  storage: SURFACES.blackSteel,
  wash: SURFACES.stainless,
};

const BY_LABEL: Partial<Record<Label, SurfaceSpec>> = {
  cupShelf: SURFACES.walnut,
  entrance: SURFACES.glass,
  entranceMat: SURFACES.coir,
  frontCounter: SURFACES.walnut,
  grinder: SURFACES.blackSteel,
  menuBoard: SURFACES.chalk,
  orderScreen: SURFACES.screen,
  pastryCase: SURFACES.glass,
  pickupScreen: SURFACES.screen,
};

export const surfaceOf = ({ kind, label }: StoreLayoutItem) =>
  BY_LABEL[label] ?? BY_KIND[kind];

const GLASS_OPACITY = 0.22;

interface SurfaceProps {
  ghost?: boolean;
  spec: SurfaceSpec;
}

const Surface = ({ ghost = false, spec }: SurfaceProps) => {
  const { color, emissive, glass, metalness = 0, roughness, wood } = spec;

  if (glass)
    return (
      <meshPhysicalMaterial
        clearcoat={1}
        color={color}
        depthWrite={false}
        opacity={ghost ? ghostSurface(true).opacity : GLASS_OPACITY}
        roughness={roughness}
        transparent
      />
    );

  return (
    <meshStandardMaterial
      color={color}
      map={wood ? realisticTextures().wood : null}
      metalness={metalness}
      roughness={roughness}
      {...(emissive && { emissive })}
      {...ghostSurface(ghost)}
    />
  );
};

export default Surface;
