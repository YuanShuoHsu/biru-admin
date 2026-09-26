"use client";

import { type RefObject, useRef } from "react";

import {
  STORE_LAYOUT_ELEVATOR,
  STORE_LAYOUT_ELEVATOR_WALLS,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_HEIGHT,
} from "@/constants/storeLayout";

import { blueGrey, grey } from "@mui/material/colors";

import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import type { Mesh } from "three";

import type {
  StoreLayoutFloor,
  StoreLayoutFloorFilter,
} from "@/types/storeLayout";

import Surface, { SURFACES } from "../Realistic/Surface";
import SpriteLabel from "../SpriteLabel";
import { ghostEdge, ghostSurface } from "../ghost";
import {
  type ElevatorBox,
  type ElevatorState,
  createElevatorState,
  elevatorCar,
  elevatorDoors,
} from "./motion";

const { door } = STORE_LAYOUT_ELEVATOR;

const GLASS_OPACITY = 0.3;
const LABEL_ABOVE_DOOR = 0.35;
const CAR_DRAW_LIFT = 0.005;

const centerOf = ({
  depth,
  elevation,
  height,
  width,
  x,
  z,
}: ElevatorBox): [number, number, number] => [
  x + width / 2,
  elevation + height / 2,
  z + depth / 2,
];

const carCenter = (box: ElevatorBox): [number, number, number] => {
  const [x, y, z] = centerOf(box);

  return [x, y + CAR_DRAW_LIFT, z];
};

const INITIAL_STATE = createElevatorState();
const INITIAL_CAR = elevatorCar(INITIAL_STATE);
const INITIAL_DOORS = elevatorDoors(INITIAL_STATE);

interface ElevatorProps {
  elevatorRef: RefObject<ElevatorState>;
  floors: StoreLayoutFloorFilter;
  isGhostFloor: (floor: StoreLayoutFloor) => boolean;
  label: string | null;
  realistic: boolean;
}

const Elevator = ({
  elevatorRef,
  floors,
  isGhostFloor,
  label,
  realistic,
}: ElevatorProps) => {
  const carRefs = useRef<(Mesh | null)[]>([]);
  const doorRefs = useRef<(Mesh | null)[]>([]);

  const shows = (floor: StoreLayoutFloor) =>
    floors === "all" || floors === floor;

  useFrame(() => {
    const elevator = elevatorRef.current;
    const level = elevator.y / STORE_LAYOUT_FLOOR_HEIGHT;
    const carVisible =
      shows(STORE_LAYOUT_FLOORS[Math.floor(level)]) ||
      shows(STORE_LAYOUT_FLOORS[Math.ceil(level)]);

    elevatorCar(elevator).forEach((box, index) => {
      const mesh = carRefs.current[index];

      mesh?.position.set(...carCenter(box));
      if (mesh) mesh.visible = carVisible;
    });

    elevatorDoors(elevator).forEach((box, index) =>
      doorRefs.current[index]?.position.set(...centerOf(box)),
    );
  });

  return (
    <>
      {STORE_LAYOUT_ELEVATOR_WALLS.map((wall) => {
        if (!shows(wall.floor)) return null;

        const { depth, elevation, height, width, x, z } = wall;
        const ghost = isGhostFloor(wall.floor);

        return (
          <mesh
            key={`${wall.floor}-${x}-${z}-${elevation}`}
            position={[
              x + width / 2,
              STORE_LAYOUT_FLOOR_BASE[wall.floor] + elevation + height / 2,
              z + depth / 2,
            ]}
          >
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial
              color={blueGrey[100]}
              depthWrite={false}
              opacity={ghost ? 0.06 : GLASS_OPACITY}
              transparent
            />
            {!realistic && <Edges color={grey[700]} {...ghostEdge(ghost)} />}
          </mesh>
        );
      })}
      {INITIAL_CAR.map((box, index) => (
        <mesh
          castShadow={realistic}
          key={`car-${index}`}
          position={carCenter(box)}
          ref={(mesh) => {
            carRefs.current[index] = mesh;
          }}
        >
          <boxGeometry args={[box.width, box.height, box.depth]} />
          {realistic ? (
            <Surface spec={SURFACES.stainless} />
          ) : (
            <meshStandardMaterial color={grey[400]} />
          )}
          {!realistic && <Edges color={grey[700]} />}
        </mesh>
      ))}
      {INITIAL_DOORS.map((box, index) => {
        const floor = STORE_LAYOUT_FLOORS[Math.floor(index / 2)];
        if (!shows(floor)) return null;

        const ghost = isGhostFloor(floor);

        return (
          <mesh
            castShadow={realistic && !ghost}
            key={`door-${index}`}
            position={centerOf(box)}
            ref={(mesh) => {
              doorRefs.current[index] = mesh;
            }}
          >
            <boxGeometry args={[box.width, box.height, box.depth]} />
            {realistic ? (
              <Surface ghost={ghost} spec={SURFACES.stainless} />
            ) : (
              <meshStandardMaterial
                color={grey[500]}
                {...ghostSurface(ghost)}
              />
            )}
            {!realistic && <Edges color={grey[700]} {...ghostEdge(ghost)} />}
          </mesh>
        );
      })}
      {label &&
        STORE_LAYOUT_FLOORS.map(
          (floor) =>
            shows(floor) &&
            !isGhostFloor(floor) && (
              <SpriteLabel
                key={floor}
                position={[
                  door.x + door.thickness,
                  STORE_LAYOUT_FLOOR_BASE[floor] +
                    door.height +
                    LABEL_ABOVE_DOOR,
                  door.z + door.width / 2,
                ]}
                text={label}
              />
            ),
        )}
    </>
  );
};

export default Elevator;
