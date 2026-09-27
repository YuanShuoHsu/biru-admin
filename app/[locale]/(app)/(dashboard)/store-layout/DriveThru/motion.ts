import {
  STORE_LAYOUT_DRIVE_THRU,
  STORE_LAYOUT_ROOM,
} from "@/constants/storeLayout";

const { curb, laneWidth, stopLines, turnRadius } = STORE_LAYOUT_DRIVE_THRU;

export const DRIVE_THRU_CAR = {
  height: 1.44,
  length: 4.7,
  wheelBase: 2.88,
  wheelRadius: 0.34,
  width: 1.85,
} as const;

const CRUISE_SPEED = 3;
const ACCELERATION = 1.2;
const DECELERATION = 1.5;
const STOP_TOLERANCE = 0.02;
const MAX_STEP = 0.1;
const DWELL_SECONDS = [5, 6];

const WALL_TO_CENTERLINE = curb.width + laneWidth / 2;
const CORNER_INSET = turnRadius - WALL_TO_CENTERLINE;

// 轉角圓心落在建築角往內縮，建築角才會剛好在內側路緣外，左右兩側車道仍能貼牆
export const DRIVE_THRU_CORNERS = {
  back: 0,
  front: STORE_LAYOUT_ROOM.depth,
  left: CORNER_INSET,
  right: STORE_LAYOUT_ROOM.width - CORNER_INSET,
} as const;

const { back, front, left, right } = DRIVE_THRU_CORNERS;

type Point = [x: number, z: number];

type Segment =
  | { from: Point; kind: "line"; to: Point }
  | { center: Point; from: number; kind: "arc" };

const QUARTER = Math.PI / 2;

const SEGMENTS: Segment[] = [
  {
    from: [right + turnRadius, front],
    kind: "line",
    to: [right + turnRadius, back],
  },
  { center: [right, back], from: 0, kind: "arc" },
  {
    from: [right, back - turnRadius],
    kind: "line",
    to: [left, back - turnRadius],
  },
  { center: [left, back], from: -QUARTER, kind: "arc" },
  {
    from: [left - turnRadius, back],
    kind: "line",
    to: [left - turnRadius, front],
  },
  { center: [left, front], from: -Math.PI, kind: "arc" },
  {
    from: [left, front + turnRadius],
    kind: "line",
    to: [right, front + turnRadius],
  },
  { center: [right, front], from: -3 * QUARTER, kind: "arc" },
];

const lengthOf = (segment: Segment) =>
  segment.kind === "arc"
    ? QUARTER * turnRadius
    : Math.hypot(
        segment.to[0] - segment.from[0],
        segment.to[1] - segment.from[1],
      );

export const DRIVE_THRU_LOOP_LENGTH = SEGMENTS.reduce(
  (total, segment) => total + lengthOf(segment),
  0,
);

export interface DriveThruPose {
  headingX: number;
  headingZ: number;
  x: number;
  z: number;
}

const poseOn = (segment: Segment, travelled: number): DriveThruPose => {
  if (segment.kind === "arc") {
    const angle = segment.from - travelled / turnRadius;

    return {
      headingX: Math.sin(angle),
      headingZ: -Math.cos(angle),
      x: segment.center[0] + turnRadius * Math.cos(angle),
      z: segment.center[1] + turnRadius * Math.sin(angle),
    };
  }

  const length = lengthOf(segment);
  const headingX = (segment.to[0] - segment.from[0]) / length;
  const headingZ = (segment.to[1] - segment.from[1]) / length;

  return {
    headingX,
    headingZ,
    x: segment.from[0] + headingX * travelled,
    z: segment.from[1] + headingZ * travelled,
  };
};

const wrap = (distance: number) =>
  ((distance % DRIVE_THRU_LOOP_LENGTH) + DRIVE_THRU_LOOP_LENGTH) %
  DRIVE_THRU_LOOP_LENGTH;

export const poseAt = (distance: number): DriveThruPose => {
  let remaining = wrap(distance);

  for (const segment of SEGMENTS) {
    const length = lengthOf(segment);

    if (remaining < length) return poseOn(segment, remaining);

    remaining -= length;
  }

  return poseOn(SEGMENTS[0], 0);
};

const STOPS = stopLines.map(
  (line) => front - (line + DRIVE_THRU_CAR.length / 2),
);

export interface DriveThruState {
  distance: number;
  nextStop: number;
  odometer: number;
  speed: number;
  waited: number | null;
}

export const createDriveThruState = (): DriveThruState => ({
  distance: 0,
  nextStop: 0,
  odometer: 0,
  speed: 0,
  waited: null,
});

export const advanceDriveThru = (state: DriveThruState, delta: number) => {
  const step = Math.min(delta, MAX_STEP);

  if (state.waited !== null) {
    state.waited += step;

    if (state.waited >= DWELL_SECONDS[state.nextStop]) {
      state.waited = null;
      state.nextStop = (state.nextStop + 1) % STOPS.length;
    }

    return;
  }

  const remaining = wrap(STOPS[state.nextStop] - state.distance);
  const brakingSpeed = Math.sqrt(2 * DECELERATION * remaining);

  state.speed = Math.min(
    CRUISE_SPEED,
    brakingSpeed,
    state.speed + ACCELERATION * step,
  );

  const travel = state.speed * step;

  if (remaining - travel <= STOP_TOLERANCE) {
    state.odometer += remaining;
    state.distance = STOPS[state.nextStop];
    state.speed = 0;
    state.waited = 0;

    return;
  }

  state.odometer += travel;
  state.distance = wrap(state.distance + travel);
};
