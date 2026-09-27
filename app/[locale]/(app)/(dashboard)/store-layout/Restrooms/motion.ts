import {
  STORE_LAYOUT_DOORS,
  STORE_LAYOUT_DOOR_LEAF,
  STORE_LAYOUT_FLOOR_BASE,
} from "@/constants/storeLayout";

import type { ElevatorBox } from "../Elevator/motion";

const DOOR_SECONDS = 0.8;
const LEVEL_TOLERANCE = 0.5;
const SENSE_MARGIN = 0.45;

type Door = (typeof STORE_LAYOUT_DOORS)[number];

export const createDoorsState = () => STORE_LAYOUT_DOORS.map(() => 0);

const middleOf = ({ closed, hinge, width }: Door) => [
  hinge[0] + (closed[0] * width) / 2,
  hinge[1] + (closed[1] * width) / 2,
];

// 感應半徑要蓋過門片掃過的範圍，否則人站在門邊時門會關進人身上
const senseRadius = ({ width }: Door) =>
  Math.hypot(width, width / 2) + SENSE_MARGIN;

interface Walker {
  x: number;
  y: number;
  z: number;
}

export const advanceDoors = (
  doors: number[],
  { x, y, z }: Walker,
  delta: number,
) => {
  STORE_LAYOUT_DOORS.forEach((door, index) => {
    const [middleX, middleZ] = middleOf(door);
    const near =
      Math.abs(y - STORE_LAYOUT_FLOOR_BASE[door.floor]) < LEVEL_TOLERANCE &&
      Math.hypot(x - middleX, z - middleZ) < senseRadius(door);
    const step = (near ? delta : -delta) / DOOR_SECONDS;

    doors[index] = Math.min(1, Math.max(0, doors[index] + step));
  });
};

export const doorAngle = (openness: number) => (Math.PI / 2) * openness;

const spanOf = (from: number, to: number): [number, number] =>
  from === to
    ? [from - STORE_LAYOUT_DOOR_LEAF / 2, from + STORE_LAYOUT_DOOR_LEAF / 2]
    : [Math.min(from, to), Math.max(from, to)];

const leafAlong = (
  door: Door,
  [startX, startZ]: [number, number],
  [directionX, directionZ]: [number, number],
): ElevatorBox => {
  const [fromX, toX] = spanOf(startX, startX + directionX * door.width);
  const [fromZ, toZ] = spanOf(startZ, startZ + directionZ * door.width);

  return {
    depth: toZ - fromZ,
    elevation: STORE_LAYOUT_FLOOR_BASE[door.floor] + door.bottom,
    height: door.height,
    width: toX - fromX,
    x: fromX,
    z: fromZ,
  };
};

// 碰撞只能用軸對齊的盒子，旋轉中的門片沒辦法精確表示，全開前一律當作關著
export const doorLeaves = (doors: number[]) =>
  STORE_LAYOUT_DOORS.map((door, index) => {
    const openness = doors[index];
    const { closed, hinge, open, slide, width } = door;

    if (slide)
      return leafAlong(
        door,
        [
          hinge[0] + open[0] * width * openness,
          hinge[1] + open[1] * width * openness,
        ],
        closed,
      );

    return leafAlong(door, hinge, openness === 1 ? open : closed);
  });
