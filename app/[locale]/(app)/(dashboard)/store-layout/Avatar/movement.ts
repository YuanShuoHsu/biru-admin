import {
  STORE_LAYOUT_AVATAR,
  STORE_LAYOUT_DOORS,
  STORE_LAYOUT_ELEVATOR_WALLS,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_HEIGHT,
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_RESTROOM_WALLS,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SEATS,
  STORE_LAYOUT_SLAB_PANELS,
  STORE_LAYOUT_SLAB_THICKNESS,
  STORE_LAYOUT_STAIR_FLIGHTS,
  STORE_LAYOUT_STAIR_GUARDS,
  STORE_LAYOUT_STAIR_GUARD_HEIGHT,
  STORE_LAYOUT_STAIR_RISER,
  STORE_LAYOUT_STAIR_STEPS,
  STORE_LAYOUT_STAIR_TREAD,
} from "@/constants/storeLayout";

import type { ElevatorBox } from "../Elevator/motion";

const { gravity, jumpSpeed, radius } = STORE_LAYOUT_AVATAR;

const PERSON_HEIGHT = 1.7;

const STEP_UP = 0.45;

const STEP_DOWN = 0.3;

const FOOT_REACH = 0.35;

interface Footprint {
  depth: number;
  width: number;
  x: number;
  z: number;
}

interface Solid extends Footprint {
  bottom: number;
  top: number;
}

const SOLIDS: Solid[] = [
  ...[
    ...STORE_LAYOUT_ITEMS,
    ...STORE_LAYOUT_SEATS,
    ...STORE_LAYOUT_ELEVATOR_WALLS,
    ...STORE_LAYOUT_RESTROOM_WALLS,
    ...STORE_LAYOUT_DOORS.map(({ leaf }) => leaf),
  ].map(({ depth, elevation, floor, height, width, x, z }) => ({
    bottom: STORE_LAYOUT_FLOOR_BASE[floor] + elevation,
    depth,
    top: STORE_LAYOUT_FLOOR_BASE[floor] + elevation + height,
    width,
    x,
    z,
  })),
  ...STORE_LAYOUT_STAIR_STEPS.map(({ depth, top, width, x, z }) => ({
    bottom: 0,
    depth,
    top,
    width,
    x,
    z,
  })),
  ...STORE_LAYOUT_SLAB_PANELS.map(({ depth, width, x, z }) => ({
    bottom: STORE_LAYOUT_FLOOR_HEIGHT - STORE_LAYOUT_SLAB_THICKNESS,
    depth,
    top: STORE_LAYOUT_FLOOR_HEIGHT,
    width,
    x,
    z,
  })),
  ...STORE_LAYOUT_STAIR_GUARDS.map(({ depth, width, x, z }) => ({
    bottom: STORE_LAYOUT_FLOOR_HEIGHT,
    depth,
    top: STORE_LAYOUT_FLOOR_HEIGHT + STORE_LAYOUT_STAIR_GUARD_HEIGHT,
    width,
    x,
    z,
  })),
];

const clampToRoom = (value: number, size: number) =>
  Math.min(Math.max(value, radius), size - radius);

const covers = (area: Footprint, x: number, z: number) =>
  x >= area.x &&
  x <= area.x + area.width &&
  z >= area.z &&
  z <= area.z + area.depth;

export const floorIndexAt = (feet: number) =>
  Math.min(
    STORE_LAYOUT_FLOORS.length - 1,
    Math.floor((feet + STEP_UP) / STORE_LAYOUT_FLOOR_HEIGHT),
  );

const overlaps = (solid: Solid, x: number, z: number) =>
  x + radius > solid.x &&
  x - radius < solid.x + solid.width &&
  z + radius > solid.z &&
  z - radius < solid.z + solid.depth;

const toSolid = ({ depth, elevation, height, width, x, z }: ElevatorBox) => ({
  bottom: elevation,
  depth,
  top: elevation + height,
  width,
  x,
  z,
});

const supportAt = (
  solids: Solid[],
  x: number,
  z: number,
  feet: number,
  reach: number,
  lowest = 0,
) =>
  solids.reduce(
    (highest, solid) =>
      covers(solid, x, z) && solid.top <= feet + reach && solid.top > highest
        ? solid.top
        : highest,
    lowest,
  );

const isBlocked = (
  solids: Solid[],
  x: number,
  z: number,
  feet: number,
  reach: number,
) =>
  solids.some(
    (solid) =>
      solid.top > feet + reach &&
      solid.bottom < feet + PERSON_HEIGHT &&
      overlaps(solid, x, z),
  );

const rampAt = (x: number, z: number) => {
  for (const {
    base,
    direction,
    risers,
    start,
    width,
    ...flight
  } of STORE_LAYOUT_STAIR_FLIGHTS) {
    if (x < flight.x || x > flight.x + width) continue;

    const run = (z - start) * direction;

    if (
      run >= -STORE_LAYOUT_STAIR_TREAD / 2 &&
      run <= (risers - 0.5) * STORE_LAYOUT_STAIR_TREAD
    )
      return (
        base + STORE_LAYOUT_STAIR_RISER * (run / STORE_LAYOUT_STAIR_TREAD + 0.5)
      );
  }

  return null;
};

// 腳伸進空的電梯井道時，兜底的 0 m 會把骨盆拉到樓下，腳下構不到的地方要當作同高
export const footholdAt = (
  x: number,
  z: number,
  from: number,
  movingBoxes: ElevatorBox[],
) => {
  const lowest = from - FOOT_REACH;
  const support = supportAt(
    [...SOLIDS, ...movingBoxes.map(toSolid)],
    x,
    z,
    from,
    FOOT_REACH,
    lowest,
  );

  return support > lowest ? support : from;
};

export const surfaceAt = (
  x: number,
  z: number,
  from: number,
  movingBoxes: ElevatorBox[],
) => {
  const ramp = rampAt(x, z);

  return ramp !== null && ramp <= from + FOOT_REACH
    ? ramp
    : footholdAt(x, z, from, movingBoxes);
};

export interface AvatarState {
  verticalSpeed: number;
  x: number;
  y: number;
  z: number;
}

export interface AvatarInput {
  forwardX: number;
  forwardZ: number;
  jump: boolean;
  sideways: number;
  speed: number;
  towards: number;
}

export const advanceAvatar = (
  state: AvatarState,
  { forwardX, forwardZ, jump, sideways, speed, towards }: AvatarInput,
  delta: number,
  movingBoxes: ElevatorBox[],
) => {
  const solids = [...SOLIDS, ...movingBoxes.map(toSolid)];
  const feet = state.y;
  const airborne = Boolean(state.verticalSpeed);
  const reach = airborne ? 0 : STEP_UP;

  if (sideways || towards) {
    const stepX = forwardX * towards - forwardZ * sideways;
    const stepZ = forwardZ * towards + forwardX * sideways;
    const length = Math.hypot(stepX, stepZ) || 1;
    const scale = (speed * delta * Math.min(1, length)) / length;

    const nextX = clampToRoom(state.x + stepX * scale, STORE_LAYOUT_ROOM.width);
    const nextZ = clampToRoom(state.z + stepZ * scale, STORE_LAYOUT_ROOM.depth);

    const trapped =
      !airborne && isBlocked(solids, state.x, state.z, feet, reach);

    if (trapped || !isBlocked(solids, nextX, state.z, feet, reach))
      state.x = nextX;
    if (trapped || !isBlocked(solids, state.x, nextZ, feet, reach))
      state.z = nextZ;
  }

  const ramp = rampAt(state.x, state.z);
  const onRamp = ramp !== null && ramp <= feet + reach;
  const support = onRamp
    ? ramp
    : supportAt(solids, state.x, state.z, feet, reach);
  const grounded =
    state.verticalSpeed <= 0 && feet - support <= (airborne ? 1e-4 : STEP_DOWN);

  const snap = grounded && !onRamp ? support - feet : 0;

  if (grounded) {
    state.y = support;
    state.verticalSpeed = jump ? jumpSpeed : 0;
  }

  if (state.verticalSpeed || !grounded) {
    state.verticalSpeed -= gravity * delta;

    const nextY = state.y + state.verticalSpeed * delta;

    if (nextY > support) state.y = nextY;
    else {
      state.y = support;
      state.verticalSpeed = 0;
    }
  }

  return snap;
};
