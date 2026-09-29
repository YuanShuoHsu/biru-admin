"use client";

import {
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_KIND_COLORS,
  STORE_LAYOUT_PENTHOUSE_CEILINGS,
  STORE_LAYOUT_ROOF_GUARDS,
  STORE_LAYOUT_ROOF_WALLS,
  STORE_LAYOUT_ROOM,
} from "@/constants/storeLayout";

import { grey } from "@mui/material/colors";

import { Edges } from "@react-three/drei";

import Surface, { SURFACES } from "../Realistic/Surface";
import { ghostEdge, ghostSurface } from "../ghost";

const WALL_OPACITY = 0.35;
const CEILING_DROP = 0.002;

const ROOF_BASE = STORE_LAYOUT_FLOOR_BASE.roof;

interface Box {
  depth: number;
  elevation: number;
  height: number;
  width: number;
  x: number;
  z: number;
}

const centerOf = ({
  depth,
  elevation,
  height,
  width,
  x,
  z,
}: Box): [number, number, number] => [
  x + width / 2,
  ROOF_BASE + elevation + height / 2,
  z + depth / 2,
];

interface RooftopProps {
  ghost: boolean;
  realistic: boolean;
}

const Rooftop = ({ ghost, realistic }: RooftopProps) => (
  <>
    {STORE_LAYOUT_ROOF_WALLS.map((wall) => (
      <mesh
        castShadow={realistic && !ghost}
        key={`wall-${wall.x}-${wall.z}-${wall.elevation}`}
        position={centerOf(wall)}
        receiveShadow={realistic}
      >
        <boxGeometry args={[wall.width, wall.height, wall.depth]} />
        {realistic ? (
          <Surface ghost={ghost} spec={SURFACES.plaster} />
        ) : (
          <meshStandardMaterial
            color={grey[300]}
            depthWrite={false}
            opacity={ghost ? ghostSurface(true).opacity : WALL_OPACITY}
            transparent
          />
        )}
        {!realistic && <Edges color={grey[700]} {...ghostEdge(ghost)} />}
      </mesh>
    ))}
    {STORE_LAYOUT_ROOF_GUARDS.map((guard) => (
      <mesh key={`guard-${guard.x}-${guard.z}`} position={centerOf(guard)}>
        <boxGeometry args={[guard.width, guard.height, guard.depth]} />
        {realistic ? (
          <Surface ghost={ghost} spec={SURFACES.glass} />
        ) : (
          <meshStandardMaterial
            color={STORE_LAYOUT_KIND_COLORS.stair}
            {...ghostSurface(ghost)}
          />
        )}
        {!realistic && <Edges color={grey[700]} {...ghostEdge(ghost)} />}
      </mesh>
    ))}
    {realistic &&
      !ghost &&
      STORE_LAYOUT_PENTHOUSE_CEILINGS.map(({ depth, width, x, z }) => (
        <mesh
          key={`ceiling-${x}-${z}`}
          position={[
            x + width / 2,
            ROOF_BASE + STORE_LAYOUT_ROOM.height - CEILING_DROP,
            z + depth / 2,
          ]}
          rotation-x={Math.PI / 2}
        >
          <planeGeometry args={[width, depth]} />
          <Surface spec={SURFACES.plaster} />
        </mesh>
      ))}
  </>
);

export default Rooftop;
