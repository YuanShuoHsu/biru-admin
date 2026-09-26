import {
  STORE_LAYOUT_ELEVATOR,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
} from "@/constants/storeLayout";

const { car, door, landing } = STORE_LAYOUT_ELEVATOR;

const FLOOR_LEVELS = STORE_LAYOUT_FLOORS.map(
  (floor) => STORE_LAYOUT_FLOOR_BASE[floor],
);

const SPEED = 1;
const DOOR_SECONDS = 1;
const DWELL_BOARDED = 1.5;
const DWELL_IDLE = 3;
const LEVEL_TOLERANCE = 0.5;
const DOORWAY_REACH = 0.35;

const CAR_FLOOR_THICKNESS = 0.08;
const CAR_HEIGHT = 2.3;

export interface ElevatorState {
  boarded: boolean;
  doors: number;
  floorIndex: number;
  phase: "closed" | "closing" | "moving" | "open" | "opening";
  riding: boolean;
  targetIndex: number;
  waited: number;
  y: number;
}

export const createElevatorState = (): ElevatorState => ({
  boarded: false,
  doors: 0,
  floorIndex: 0,
  phase: "closed",
  riding: false,
  targetIndex: 0,
  waited: 0,
  y: 0,
});

interface Area {
  depth: number;
  width: number;
  x: number;
  z: number;
}

const covers = (area: Area, x: number, z: number) =>
  x >= area.x &&
  x <= area.x + area.width &&
  z >= area.z &&
  z <= area.z + area.depth;

const DOORWAY: Area = {
  depth: door.width,
  width: door.thickness + DOORWAY_REACH * 2,
  x: door.x - DOORWAY_REACH,
  z: door.z,
};

interface Passenger {
  x: number;
  y: number;
  z: number;
}

// 回傳這一幀車廂位移，站在車廂裡的角色要跟著移動同樣的量，否則下降時會一路自由落體追著車廂跑
export const advanceElevator = (
  state: ElevatorState,
  { x, y, z }: Passenger,
  delta: number,
) => {
  const inCar = covers(car, x, z) && Math.abs(y - state.y) < LEVEL_TOLERANCE;
  const waitingAt = covers(landing, x, z)
    ? FLOOR_LEVELS.findIndex((level) => Math.abs(y - level) < LEVEL_TOLERANCE)
    : -1;
  const inDoorway = covers(DOORWAY, x, z);

  if (state.phase !== "moving")
    state.boarded = inCar && (state.boarded || !state.riding);
  state.riding = inCar;

  switch (state.phase) {
    case "closed":
      if (state.boarded) {
        state.boarded = false;
        state.targetIndex = (state.floorIndex + 1) % FLOOR_LEVELS.length;
        state.phase = "moving";
      } else if (inCar || waitingAt === state.floorIndex)
        state.phase = "opening";
      else if (waitingAt >= 0) {
        state.targetIndex = waitingAt;
        state.phase = "moving";
      }
      return 0;

    case "opening":
      state.doors = Math.min(1, state.doors + delta / DOOR_SECONDS);
      if (state.doors === 1) {
        state.phase = "open";
        state.waited = 0;
      }
      return 0;

    case "open":
      state.waited =
        inDoorway ||
        (inCar && !state.boarded) ||
        (waitingAt === state.floorIndex && !inCar)
          ? 0
          : state.waited + delta;
      if (state.waited >= (state.boarded ? DWELL_BOARDED : DWELL_IDLE))
        state.phase = "closing";
      return 0;

    case "closing":
      if (inDoorway) {
        state.phase = "opening";
        return 0;
      }
      state.doors = Math.max(0, state.doors - delta / DOOR_SECONDS);
      if (state.doors === 0) state.phase = "closed";
      return 0;

    case "moving": {
      const goal = FLOOR_LEVELS[state.targetIndex];
      const step = Math.max(
        -SPEED * delta,
        Math.min(SPEED * delta, goal - state.y),
      );

      state.y += step;
      if (state.y === goal) {
        state.floorIndex = state.targetIndex;
        state.phase = "opening";
      }
      return step;
    }
  }
};

export interface ElevatorBox {
  depth: number;
  elevation: number;
  height: number;
  width: number;
  x: number;
  z: number;
}

export const elevatorCar = ({ y }: ElevatorState): ElevatorBox[] => [
  {
    depth: car.depth,
    elevation: y - CAR_FLOOR_THICKNESS,
    height: CAR_FLOOR_THICKNESS,
    width: car.width,
    x: car.x,
    z: car.z,
  },
  {
    depth: car.depth,
    elevation: y + CAR_HEIGHT,
    height: CAR_FLOOR_THICKNESS,
    width: car.width,
    x: car.x,
    z: car.z,
  },
];

const HALF_DOOR = door.width / 2;

export const elevatorDoors = ({
  doors,
  floorIndex,
  phase,
}: ElevatorState): ElevatorBox[] =>
  FLOOR_LEVELS.flatMap((level, index) => {
    const shift =
      index === floorIndex && phase !== "moving" ? HALF_DOOR * doors : 0;
    const leaf = {
      depth: HALF_DOOR,
      elevation: level,
      height: door.height,
      width: door.thickness,
      x: door.x,
    };

    return [
      { ...leaf, z: door.z - shift },
      { ...leaf, z: door.z + HALF_DOOR + shift },
    ];
  });
