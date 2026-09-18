import {
  STORE_LAYOUT_AVATAR,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_HEIGHT,
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SLAB_PANELS,
  STORE_LAYOUT_SLAB_THICKNESS,
  STORE_LAYOUT_STAIR_STEPS,
} from "@/constants/storeLayout";

const { gravity, jumpSpeed, radius, speed } = STORE_LAYOUT_AVATAR;

const PERSON_HEIGHT = 1.7;

const STEP_UP = 0.45;

interface Solid {
  bottom: number;
  depth: number;
  top: number;
  width: number;
  x: number;
  z: number;
}

const SOLIDS: Solid[] = [
  ...STORE_LAYOUT_ITEMS.map(
    ({ depth, elevation, floor, height, width, x, z }) => ({
      bottom: STORE_LAYOUT_FLOOR_BASE[floor] + elevation,
      depth,
      top: STORE_LAYOUT_FLOOR_BASE[floor] + elevation + height,
      width,
      x,
      z,
    }),
  ),
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
];

const clampToRoom = (value: number, size: number) =>
  Math.min(Math.max(value, radius), size - radius);

const covers = (solid: Solid, x: number, z: number) =>
  x > solid.x &&
  x < solid.x + solid.width &&
  z > solid.z &&
  z < solid.z + solid.depth;

const overlaps = (solid: Solid, x: number, z: number) =>
  x + radius > solid.x &&
  x - radius < solid.x + solid.width &&
  z + radius > solid.z &&
  z - radius < solid.z + solid.depth;

export const supportAt = (x: number, z: number, feet: number) =>
  SOLIDS.reduce(
    (highest, solid) =>
      covers(solid, x, z) && solid.top <= feet + STEP_UP && solid.top > highest
        ? solid.top
        : highest,
    0,
  );

const isBlocked = (x: number, z: number, feet: number) =>
  SOLIDS.some(
    (solid) =>
      solid.top > feet + STEP_UP &&
      solid.bottom < feet + PERSON_HEIGHT &&
      overlaps(solid, x, z),
  );

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
  towards: number;
}

export const advanceAvatar = (
  state: AvatarState,
  { forwardX, forwardZ, jump, sideways, towards }: AvatarInput,
  delta: number,
) => {
  const feet = state.y;

  if (sideways || towards) {
    const stepX = forwardX * towards - forwardZ * sideways;
    const stepZ = forwardZ * towards + forwardX * sideways;
    const length = Math.hypot(stepX, stepZ) || 1;
    const scale = (speed * delta) / length;

    const nextX = clampToRoom(state.x + stepX * scale, STORE_LAYOUT_ROOM.width);
    const nextZ = clampToRoom(state.z + stepZ * scale, STORE_LAYOUT_ROOM.depth);

    const trapped = isBlocked(state.x, state.z, feet);

    if (trapped || !isBlocked(nextX, state.z, feet)) state.x = nextX;
    if (trapped || !isBlocked(state.x, nextZ, feet)) state.z = nextZ;
  }

  const support = supportAt(state.x, state.z, feet);
  const grounded = feet <= support + 1e-4 && state.verticalSpeed <= 0;

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
};
