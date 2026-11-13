import {
  amber,
  blue,
  blueGrey,
  brown,
  deepOrange,
  deepPurple,
  green,
  grey,
  lightBlue,
  lightGreen,
  pink,
  teal,
} from "@mui/material/colors";

export const STORE_LAYOUT_ROOM = {
  depth: 21,
  height: 2.8,
  width: 15.75,
} as const;

export const STORE_LAYOUT_FLOORS = ["ground", "upper", "roof"] as const;

export const STORE_LAYOUT_FLOOR_FILTERS = [
  ...STORE_LAYOUT_FLOORS,
  "all",
] as const;

export const STORE_LAYOUT_KIND_COLORS = {
  bar: deepPurple[200],
  cold: blue[300],
  equipment: grey[200],
  front: green[300],
  heat: deepOrange[300],
  prep: amber[300],
  seat: blueGrey[200],
  lawn: lightGreen[300],
  plant: green[400],
  restroom: teal[200],
  stair: brown[300],
  storage: blueGrey[300],
  wash: lightBlue[300],
} as const;

export const STORE_LAYOUT_WALLS = [
  {
    position: [STORE_LAYOUT_ROOM.width / 2, STORE_LAYOUT_ROOM.height / 2, 0],
    rotationY: 0,
    width: STORE_LAYOUT_ROOM.width,
  },
  {
    position: [0, STORE_LAYOUT_ROOM.height / 2, STORE_LAYOUT_ROOM.depth / 2],
    rotationY: Math.PI / 2,
    width: STORE_LAYOUT_ROOM.depth,
  },
  {
    position: [
      STORE_LAYOUT_ROOM.width,
      STORE_LAYOUT_ROOM.height / 2,
      STORE_LAYOUT_ROOM.depth / 2,
    ],
    rotationY: Math.PI / 2,
    width: STORE_LAYOUT_ROOM.depth,
  },
  {
    position: [
      STORE_LAYOUT_ROOM.width / 2,
      STORE_LAYOUT_ROOM.height / 2,
      STORE_LAYOUT_ROOM.depth,
    ],
    rotationY: 0,
    width: STORE_LAYOUT_ROOM.width,
  },
] as const;

type LayoutFloor = (typeof STORE_LAYOUT_FLOORS)[number];

const WINDOW_COUNTER_Z = STORE_LAYOUT_ROOM.depth - 0.5;
const WINDOW_COUNTER_DEPTH = 0.45;

const windowCounter = (floor: LayoutFloor, from: number, to: number) => ({
  floor,
  width: to - from,
  x: from,
});

const RESTROOM_WALL = 0.1;
const STORE_LAYOUT_RESTROOM_DOOR_HEIGHT = 2.1;
const STALL_PARTITION = 0.03;
const STALL_PARTITION_HEIGHT = 1.85;
const STALL_PARTITION_GAP = 0.15;
export const STORE_LAYOUT_DOOR_LEAF = 0.04;
const DOOR_ARC_SEGMENTS = 12;

const ACCESSIBLE_RESTROOM = { depth: 2.2, width: 2.3, x: 0, z: 9.3 } as const;
const WOMEN_RESTROOM = { depth: 3.9, width: 3.3, x: 0, z: 11.6 } as const;
const MEN_RESTROOM = { depth: 2.5, width: 3.3, x: 0, z: 15.7 } as const;

const WOMEN_STALLS = [11.6, 12.6, 13.6, 14.6];
const MEN_STALL = 15.7;
const STALL_WIDTH = 1;
const STALL_DEPTH = 1.5;
const STALL_DOOR_OFFSET = 0.4;
const STALL_DOOR_WIDTH = 0.55;

const ACCESSIBLE_DOOR = { from: 10.4, to: 11.3 } as const;
const WOMEN_DOOR = { from: 14.6, to: 15.5 } as const;
const MEN_DOOR = { from: 15.8, to: 16.7 } as const;

const CORE_FACE = WOMEN_RESTROOM.width;
const CORE_END = MEN_RESTROOM.z + MEN_RESTROOM.depth;

const box = (
  floor: LayoutFloor,
  [fromX, toX]: [number, number],
  [fromZ, toZ]: [number, number],
  elevation = 0,
  height: number = STORE_LAYOUT_ROOM.height,
) => ({
  depth: toZ - fromZ,
  elevation,
  floor,
  height,
  width: toX - fromX,
  x: fromX,
  z: fromZ,
});

const lintel = (floor: LayoutFloor, x: [number, number], z: [number, number]) =>
  box(
    floor,
    x,
    z,
    STORE_LAYOUT_RESTROOM_DOOR_HEIGHT,
    STORE_LAYOUT_ROOM.height - STORE_LAYOUT_RESTROOM_DOOR_HEIGHT,
  );

const stallPartition = (
  floor: LayoutFloor,
  x: [number, number],
  z: [number, number],
) => box(floor, x, z, STALL_PARTITION_GAP, STALL_PARTITION_HEIGHT);

const stallWalls = (floor: LayoutFloor, from: number, partitioned: boolean) => {
  const hinge = from + STALL_WIDTH - STALL_PARTITION;
  const doorFrom = from + STALL_DOOR_OFFSET;

  return [
    ...(partitioned
      ? [
          stallPartition(
            floor,
            [0, STALL_DEPTH],
            [hinge, hinge + STALL_PARTITION],
          ),
        ]
      : []),
    stallPartition(
      floor,
      [STALL_DEPTH, STALL_DEPTH + STALL_PARTITION],
      [from, doorFrom],
    ),
  ];
};

// 兩層廁所疊在同一位置，給排水管才能共用同一組立管
const restroomWalls = (floor: LayoutFloor) => {
  const inner = CORE_FACE;
  const outer = CORE_FACE + RESTROOM_WALL;
  const accessibleFace = ACCESSIBLE_RESTROOM.width;

  return [
    box(floor, [0, accessibleFace + RESTROOM_WALL], [9.2, 9.3]),
    box(
      floor,
      [accessibleFace, accessibleFace + RESTROOM_WALL],
      [9.3, ACCESSIBLE_DOOR.from],
    ),
    box(
      floor,
      [accessibleFace, accessibleFace + RESTROOM_WALL],
      [ACCESSIBLE_DOOR.to, WOMEN_RESTROOM.z - RESTROOM_WALL],
    ),
    lintel(
      floor,
      [accessibleFace, accessibleFace + RESTROOM_WALL],
      [ACCESSIBLE_DOOR.from, ACCESSIBLE_DOOR.to],
    ),
    box(
      floor,
      [0, outer],
      [WOMEN_RESTROOM.z - RESTROOM_WALL, WOMEN_RESTROOM.z],
    ),
    box(floor, [inner, outer], [WOMEN_RESTROOM.z, WOMEN_DOOR.from]),
    lintel(floor, [inner, outer], [WOMEN_DOOR.from, WOMEN_DOOR.to]),
    box(floor, [inner, outer], [WOMEN_DOOR.to, MEN_DOOR.from]),
    box(floor, [0, inner], [MEN_RESTROOM.z - RESTROOM_WALL, MEN_RESTROOM.z]),
    lintel(floor, [inner, outer], [MEN_DOOR.from, MEN_DOOR.to]),
    box(floor, [inner, outer], [MEN_DOOR.to, CORE_END]),
    box(floor, [0, outer], [CORE_END, CORE_END + RESTROOM_WALL]),
    ...WOMEN_STALLS.flatMap((from, index) =>
      stallWalls(floor, from, index < WOMEN_STALLS.length - 1),
    ),
    ...stallWalls(floor, MEN_STALL, true),
  ];
};

type Direction = [x: number, z: number];

const toward = (
  [x, z]: [number, number],
  [directionX, directionZ]: Direction,
  distance: number,
): [number, number] => [x + directionX * distance, z + directionZ * distance];

const swingDoor = (
  floor: LayoutFloor,
  hinge: [number, number],
  closed: Direction,
  open: Direction,
  width: number,
) => ({
  closed,
  floor,
  hinge,
  open,
  bottom: 0,
  glass: false,
  height: STORE_LAYOUT_RESTROOM_DOOR_HEIGHT,
  path: Array.from({ length: DOOR_ARC_SEGMENTS + 1 }, (_, index) => {
    const angle = ((Math.PI / 2) * index) / DOOR_ARC_SEGMENTS;

    return toward(
      toward(hinge, closed, width * Math.cos(angle)),
      open,
      width * Math.sin(angle),
    );
  }),
  slide: false,
  width,
});

const slideDoor = (
  floor: LayoutFloor,
  hinge: [number, number],
  open: Direction,
  width: number,
  {
    bottom = 0,
    glass = false,
    height = STORE_LAYOUT_RESTROOM_DOOR_HEIGHT,
  }: { bottom?: number; glass?: boolean; height?: number } = {},
) => {
  const closed: Direction = [-open[0], -open[1]];

  return {
    bottom,
    closed,
    floor,
    glass,
    height,
    hinge,
    open,
    path: [toward(hinge, closed, width), toward(hinge, open, width)],
    slide: true,
    width,
  };
};

const stallDoor = (floor: LayoutFloor, from: number) =>
  swingDoor(
    floor,
    [STALL_DEPTH, from + STALL_DOOR_OFFSET + STALL_DOOR_WIDTH],
    [0, -1],
    [-1, 0],
    STALL_DOOR_WIDTH,
  );

const restroomDoors = (floor: LayoutFloor) => [
  slideDoor(
    floor,
    [
      ACCESSIBLE_RESTROOM.width + RESTROOM_WALL + STORE_LAYOUT_DOOR_LEAF,
      ACCESSIBLE_DOOR.from,
    ],
    [0, -1],
    ACCESSIBLE_DOOR.to - ACCESSIBLE_DOOR.from,
  ),
  swingDoor(
    floor,
    [CORE_FACE, WOMEN_DOOR.to],
    [0, -1],
    [-1, 0],
    WOMEN_DOOR.to - WOMEN_DOOR.from,
  ),
  swingDoor(
    floor,
    [CORE_FACE, MEN_DOOR.from],
    [0, 1],
    [-1, 0],
    MEN_DOOR.to - MEN_DOOR.from,
  ),
  ...[...WOMEN_STALLS, MEN_STALL].map((from) => stallDoor(floor, from)),
];

export const STORE_LAYOUT_RESTROOM_FLOORS = [
  "ground",
  "upper",
] as const satisfies readonly LayoutFloor[];

export const STORE_LAYOUT_RESTROOMS = [
  { ...ACCESSIBLE_RESTROOM, label: "accessibleRestroom" as const },
  { ...WOMEN_RESTROOM, label: "womenRestroom" as const },
  { ...MEN_RESTROOM, label: "menRestroom" as const },
];

const GROUND_WINDOW_COUNTERS = [
  windowCounter("ground", 0.3, 6.1),
  windowCounter("ground", 9.65, 15.45),
];

const UPPER_WINDOW_COUNTERS = [windowCounter("upper", 0.3, 15.45)];

const ENTRANCE = { height: 2.1, width: 2, x: 6.9 } as const;

// 臺灣靠右行駛、駕駛座在左，取餐窗口與點餐機必須在車道左側，車道因此沿右外牆由店前往店後行駛
const DRIVE_THRU_WINDOW = { bottom: 1, from: 3, to: 4.05, top: 1.9 } as const;
const DRIVE_THRU_ORDER_POINT = 15;
const DRIVE_THRU_CURB = {
  height: 0.15,
  width: 0.3,
  x: STORE_LAYOUT_ROOM.width,
} as const;
const DRIVER_TO_BUMPER = 2;

export const STORE_LAYOUT_DRIVE_THRU = {
  arrowDistances: [10, 34, 52, 64, 86],
  crossing: { from: 6.4, stripe: 0.4, to: 9.4 },
  curb: DRIVE_THRU_CURB,
  laneWidth: 3.2,
  stopLines: [
    DRIVE_THRU_ORDER_POINT - DRIVER_TO_BUMPER,
    (DRIVE_THRU_WINDOW.from + DRIVE_THRU_WINDOW.to) / 2 - DRIVER_TO_BUMPER,
  ],
  turnRadius: 6,
  window: DRIVE_THRU_WINDOW,
} as const;

export const STORE_LAYOUT_KITCHEN_FLOOR_DEPTH = 4.8;

const WINDOW_SILL = 0.9;
const WINDOW_HEAD = 2.5;

export const STORE_LAYOUT_STOREFRONT = [
  ...[...GROUND_WINDOW_COUNTERS, ...UPPER_WINDOW_COUNTERS].map(
    ({ floor, width, x }) => ({
      bottom: WINDOW_SILL,
      floor,
      from: x,
      kind: "window" as const,
      to: x + width,
      top: WINDOW_HEAD,
    }),
  ),
  {
    bottom: 0,
    floor: "ground" as const,
    from: ENTRANCE.x,
    kind: "door" as const,
    to: ENTRANCE.x + ENTRANCE.width,
    top: ENTRANCE.height,
  },
];

export const STORE_LAYOUT_VIEWS = {
  first: { lookAhead: 1 },
  follow: {},
  iso: {
    position: [STORE_LAYOUT_ROOM.width + 9, 14, STORE_LAYOUT_ROOM.depth + 10],
    target: [STORE_LAYOUT_ROOM.width / 2, 1, STORE_LAYOUT_ROOM.depth / 2],
  },
  top: {
    position: [
      STORE_LAYOUT_ROOM.width / 2,
      26,
      STORE_LAYOUT_ROOM.depth / 2 + 0.01,
    ],
    target: [STORE_LAYOUT_ROOM.width / 2, 0, STORE_LAYOUT_ROOM.depth / 2],
  },
} as const;

export const STORE_LAYOUT_VIEW_ORDER = [
  "iso",
  "top",
  "follow",
  "first",
] as const satisfies readonly (keyof typeof STORE_LAYOUT_VIEWS)[];

export const STORE_LAYOUT_FOV = 55;

export const STORE_LAYOUT_TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

export const STORE_LAYOUT_TOUCH_MEDIA = `@media ${STORE_LAYOUT_TOUCH_QUERY}`;

export const STORE_LAYOUT_LOOK = {
  pitchLimit: (Math.PI / 180) * 80,
  speed: 1.6,
} as const;

export const STORE_LAYOUT_ZOOM_DISTANCE = {
  maxDistance: 45,
  minDistance: 1.5,
} as const;

export const STORE_LAYOUT_ZOOM_SPEED = 1.2;

export const STORE_LAYOUT_AVATAR = {
  gravity: 9.8,
  jumpSpeed: 3.2,
  radius: 0.25,
  speed: 1.4,
  sprintSpeed: 2.8,
  start: { x: STORE_LAYOUT_ROOM.width / 2, z: 19.2 },
} as const;

export const STORE_LAYOUT_CHARACTERS = {
  male: {
    cap: grey[900],
    color: grey[800],
    drawstring: grey[50],
    eye: 1.55,
    followOffset: [0, 1.2, 3.2],
    hair: grey[900],
    iris: grey[900],
    pants: blueGrey[700],
    scale: 1,
    shoe: grey[50],
    skin: brown[200],
    sole: grey[300],
  },
  female: {
    belt: deepPurple[300],
    blush: pink[100],
    color: grey[50],
    eye: 1.49,
    followOffset: [0, 1.15, 3.1],
    hair: brown[900],
    iris: grey[900],
    lips: pink[200],
    scale: 0.96,
    shoe: grey[900],
    skin: deepOrange[100],
    skirt: deepPurple[200],
    sole: grey[800],
  },
  cat: {
    belly: grey[50],
    earInner: pink[100],
    eye: 0.4,
    followOffset: [0, 1.1, 2.6],
    fur: deepOrange[400],
    iris: green[800],
    nose: pink[300],
    pupil: grey[900],
    stripe: deepOrange[800],
    whisker: grey[100],
  },
  dog: {
    belly: amber[50],
    collar: blue[600],
    ear: brown[600],
    eye: 0.58,
    followOffset: [0, 1.2, 2.8],
    fur: amber[800],
    iris: grey[900],
    nose: grey[900],
    tag: amber[400],
    tongue: pink[300],
  },
} as const;

export const STORE_LAYOUT_CHARACTER_ORDER = [
  "male",
  "female",
  "cat",
  "dog",
] as const satisfies readonly (keyof typeof STORE_LAYOUT_CHARACTERS)[];

export const STORE_LAYOUT_FLOOR_HEIGHT = 3.05;

export const STORE_LAYOUT_SLAB_THICKNESS = 0.25;

const STAIR_X = 13.95;
const STAIR_Z = 6.6;
const STAIR_WIDTH = 1.7;
const STAIR_TREAD = 0.27;
const STAIR_FLIGHT_TREADS = 8;
const STAIR_LANDING_DEPTH = 1.2;
const STAIR_RISER = STORE_LAYOUT_FLOOR_HEIGHT / 17;

const STAIR_FLIGHT_WIDTH = STAIR_WIDTH / 2;
const STAIR_FLIGHT_RUN = STAIR_FLIGHT_TREADS * STAIR_TREAD;
const STAIR_LANDING_Z = STAIR_Z + STAIR_FLIGHT_RUN;

const STAIR_SOFFIT = 0.35;

export const STORE_LAYOUT_STAIR_STOREYS = STORE_LAYOUT_FLOORS.slice(1).map(
  (to, index) => ({
    base: index * STORE_LAYOUT_FLOOR_HEIGHT,
    from: STORE_LAYOUT_FLOORS[index],
    to,
  }),
);

const flightTreads = (count: number) =>
  Array.from({ length: STAIR_FLIGHT_TREADS }, (_, index) => index + 1).map(
    (tread) => ({
      depth: STAIR_TREAD,
      top: (count + tread) * STAIR_RISER,
      width: STAIR_FLIGHT_WIDTH,
      x: count ? STAIR_X + STAIR_FLIGHT_WIDTH : STAIR_X,
      z: count
        ? STAIR_LANDING_Z - tread * STAIR_TREAD
        : STAIR_Z + (tread - 1) * STAIR_TREAD,
    }),
  );

const STOREY_STEPS = [
  ...flightTreads(0),
  {
    depth: STAIR_LANDING_DEPTH,
    top: STAIR_FLIGHT_TREADS * STAIR_RISER,
    width: STAIR_WIDTH,
    x: STAIR_X,
    z: STAIR_LANDING_Z,
  },
  ...flightTreads(STAIR_FLIGHT_TREADS),
];

// 上層梯段疊在下層梯段正上方，做成實心會壓掉下層的淨高，走到一半就撞頭
export const STORE_LAYOUT_STAIR_STEPS = STORE_LAYOUT_STAIR_STOREYS.flatMap(
  ({ base, from, to }) =>
    STOREY_STEPS.map((step) => ({
      ...step,
      bottom: base ? base + step.top - STAIR_SOFFIT : 0,
      from,
      to,
      top: base + step.top,
    })),
);

export const STORE_LAYOUT_STAIR_FLIGHTS = STORE_LAYOUT_STAIR_STOREYS.flatMap(
  ({ base }) => [
    {
      base,
      direction: 1,
      risers: STAIR_FLIGHT_TREADS,
      start: STAIR_Z,
      width: STAIR_FLIGHT_WIDTH,
      x: STAIR_X,
    },
    {
      base: base + STAIR_FLIGHT_TREADS * STAIR_RISER,
      direction: -1,
      risers: STAIR_FLIGHT_TREADS + 1,
      start: STAIR_LANDING_Z,
      width: STAIR_FLIGHT_WIDTH,
      x: STAIR_X + STAIR_FLIGHT_WIDTH,
    },
  ],
);

export const STORE_LAYOUT_STAIR_RISER = STAIR_RISER;

export const STORE_LAYOUT_STAIR_TREAD = STAIR_TREAD;

export const STORE_LAYOUT_STAIRWELL = {
  depth: STAIR_FLIGHT_RUN + STAIR_LANDING_DEPTH,
  width: STAIR_WIDTH,
  x: STAIR_X,
  z: STAIR_Z,
} as const;

const STORE_LAYOUT_STAIR_EXIT = {
  x: STAIR_X + STAIR_FLIGHT_WIDTH / 2,
  z: STAIR_Z - 0.5,
} as const;

const ELEVATOR_WALL = 0.1;
const ELEVATOR_DOOR_WIDTH = 0.9;

export const STORE_LAYOUT_ELEVATOR = {
  shaft: { depth: 1.9, width: 1.7, x: 0, z: 7.2 },
  car: { depth: 1.7, width: 1.6, x: 0, z: 7.3 },
  door: {
    height: 2.1,
    thickness: ELEVATOR_WALL,
    width: ELEVATOR_DOOR_WIDTH,
    x: 1.6,
    z: 7.7,
  },
  landing: { depth: 1.5, width: 1.5, x: 1.7, z: 7.4 },
} as const;

const { door: ELEVATOR_DOOR, shaft: ELEVATOR_SHAFT } = STORE_LAYOUT_ELEVATOR;

const elevatorWalls = (floor: LayoutFloor) => {
  const wall = {
    elevation: 0,
    floor,
    height: STORE_LAYOUT_FLOOR_HEIGHT,
  };
  const shaftEnd = ELEVATOR_SHAFT.z + ELEVATOR_SHAFT.depth;
  const doorEnd = ELEVATOR_DOOR.z + ELEVATOR_DOOR.width;

  return [
    {
      ...wall,
      depth: ELEVATOR_WALL,
      width: ELEVATOR_SHAFT.width,
      x: ELEVATOR_SHAFT.x,
      z: ELEVATOR_SHAFT.z,
    },
    {
      ...wall,
      depth: ELEVATOR_WALL,
      width: ELEVATOR_SHAFT.width,
      x: ELEVATOR_SHAFT.x,
      z: shaftEnd - ELEVATOR_WALL,
    },
    {
      ...wall,
      depth: ELEVATOR_DOOR.z - ELEVATOR_SHAFT.z,
      width: ELEVATOR_WALL,
      x: ELEVATOR_DOOR.x,
      z: ELEVATOR_SHAFT.z,
    },
    {
      ...wall,
      depth: shaftEnd - doorEnd,
      width: ELEVATOR_WALL,
      x: ELEVATOR_DOOR.x,
      z: doorEnd,
    },
    {
      ...wall,
      depth: ELEVATOR_DOOR.width,
      elevation: ELEVATOR_DOOR.height,
      height: STORE_LAYOUT_FLOOR_HEIGHT - ELEVATOR_DOOR.height,
      width: ELEVATOR_WALL,
      x: ELEVATOR_DOOR.x,
      z: ELEVATOR_DOOR.z,
    },
  ];
};

export const STORE_LAYOUT_ELEVATOR_WALLS =
  STORE_LAYOUT_FLOORS.flatMap(elevatorWalls);

export const STORE_LAYOUT_RESTROOM_WALLS =
  STORE_LAYOUT_RESTROOM_FLOORS.flatMap(restroomWalls);

const PENTHOUSE_WALL = 0.1;
const STAIR_PENTHOUSE_BACK = 4.9;
const STAIR_PENTHOUSE_DOOR = { from: 5.3, to: 6.3 } as const;
const STAIR_PENTHOUSE_WEST = STORE_LAYOUT_STAIRWELL.x - PENTHOUSE_WALL;
const STAIR_PENTHOUSE_FRONT =
  STORE_LAYOUT_STAIRWELL.z + STORE_LAYOUT_STAIRWELL.depth;
const VESTIBULE_EAST = 3.4;
const VESTIBULE_DOOR = {
  from: ELEVATOR_DOOR.z,
  to: ELEVATOR_DOOR.z + ELEVATOR_DOOR.width,
} as const;
const ELEVATOR_SHAFT_END = ELEVATOR_SHAFT.z + ELEVATOR_SHAFT.depth;

export const STORE_LAYOUT_ROOF_WALLS = [
  box(
    "roof",
    [STAIR_PENTHOUSE_WEST, STORE_LAYOUT_STAIRWELL.x],
    [STAIR_PENTHOUSE_BACK, STAIR_PENTHOUSE_DOOR.from],
  ),
  lintel(
    "roof",
    [STAIR_PENTHOUSE_WEST, STORE_LAYOUT_STAIRWELL.x],
    [STAIR_PENTHOUSE_DOOR.from, STAIR_PENTHOUSE_DOOR.to],
  ),
  box(
    "roof",
    [STAIR_PENTHOUSE_WEST, STORE_LAYOUT_STAIRWELL.x],
    [STAIR_PENTHOUSE_DOOR.to, STAIR_PENTHOUSE_FRONT + PENTHOUSE_WALL],
  ),
  box(
    "roof",
    [STORE_LAYOUT_STAIRWELL.x, STORE_LAYOUT_ROOM.width],
    [STAIR_PENTHOUSE_BACK, STAIR_PENTHOUSE_BACK + PENTHOUSE_WALL],
  ),
  box(
    "roof",
    [STORE_LAYOUT_STAIRWELL.x, STORE_LAYOUT_ROOM.width],
    [STAIR_PENTHOUSE_FRONT, STAIR_PENTHOUSE_FRONT + PENTHOUSE_WALL],
  ),
  box(
    "roof",
    [STORE_LAYOUT_ROOM.width - PENTHOUSE_WALL, STORE_LAYOUT_ROOM.width],
    [STAIR_PENTHOUSE_BACK + PENTHOUSE_WALL, STAIR_PENTHOUSE_FRONT],
  ),
  box(
    "roof",
    [ELEVATOR_SHAFT.width, VESTIBULE_EAST],
    [ELEVATOR_SHAFT.z, ELEVATOR_SHAFT.z + PENTHOUSE_WALL],
  ),
  box(
    "roof",
    [ELEVATOR_SHAFT.width, VESTIBULE_EAST],
    [ELEVATOR_SHAFT_END - PENTHOUSE_WALL, ELEVATOR_SHAFT_END],
  ),
  box(
    "roof",
    [VESTIBULE_EAST - PENTHOUSE_WALL, VESTIBULE_EAST],
    [ELEVATOR_SHAFT.z + PENTHOUSE_WALL, VESTIBULE_DOOR.from],
  ),
  lintel(
    "roof",
    [VESTIBULE_EAST - PENTHOUSE_WALL, VESTIBULE_EAST],
    [VESTIBULE_DOOR.from, VESTIBULE_DOOR.to],
  ),
  box(
    "roof",
    [VESTIBULE_EAST - PENTHOUSE_WALL, VESTIBULE_EAST],
    [VESTIBULE_DOOR.to, ELEVATOR_SHAFT_END - PENTHOUSE_WALL],
  ),
];

export const STORE_LAYOUT_PENTHOUSE_CEILINGS = [
  {
    depth: STAIR_PENTHOUSE_FRONT + PENTHOUSE_WALL - STAIR_PENTHOUSE_BACK,
    width: STORE_LAYOUT_ROOM.width - STAIR_PENTHOUSE_WEST,
    x: STAIR_PENTHOUSE_WEST,
    z: STAIR_PENTHOUSE_BACK,
  },
  {
    depth: ELEVATOR_SHAFT.depth,
    width: VESTIBULE_EAST,
    x: ELEVATOR_SHAFT.x,
    z: ELEVATOR_SHAFT.z,
  },
];

// 建築技術規則設計施工編第 38 條：平屋頂欄杆扶手高度不得小於 1.10 m
const ROOF_GUARD_HEIGHT = 1.1;
const ROOF_GUARD_THICKNESS = 0.08;

const roofGuard = (x: [number, number], z: [number, number]) =>
  box("roof", x, z, 0, ROOF_GUARD_HEIGHT);

export const STORE_LAYOUT_ROOF_GUARDS = [
  roofGuard([0, STORE_LAYOUT_ROOM.width], [0, ROOF_GUARD_THICKNESS]),
  roofGuard(
    [0, STORE_LAYOUT_ROOM.width],
    [STORE_LAYOUT_ROOM.depth - ROOF_GUARD_THICKNESS, STORE_LAYOUT_ROOM.depth],
  ),
  roofGuard(
    [0, ROOF_GUARD_THICKNESS],
    [ROOF_GUARD_THICKNESS, STORE_LAYOUT_ROOM.depth - ROOF_GUARD_THICKNESS],
  ),
  roofGuard(
    [STORE_LAYOUT_ROOM.width - ROOF_GUARD_THICKNESS, STORE_LAYOUT_ROOM.width],
    [ROOF_GUARD_THICKNESS, STORE_LAYOUT_ROOM.depth - ROOF_GUARD_THICKNESS],
  ),
];

const VESTIBULE_LEAF_WIDTH = (VESTIBULE_DOOR.to - VESTIBULE_DOOR.from) / 2;

const ROOF_DOORS = [
  slideDoor(
    "roof",
    [
      STAIR_PENTHOUSE_WEST - STORE_LAYOUT_DOOR_LEAF / 2,
      STAIR_PENTHOUSE_DOOR.to,
    ],
    [0, 1],
    STAIR_PENTHOUSE_DOOR.to - STAIR_PENTHOUSE_DOOR.from,
    { glass: true },
  ),
  slideDoor(
    "roof",
    [VESTIBULE_EAST + STORE_LAYOUT_DOOR_LEAF / 2, VESTIBULE_DOOR.from],
    [0, -1],
    VESTIBULE_LEAF_WIDTH,
    { glass: true },
  ),
  slideDoor(
    "roof",
    [VESTIBULE_EAST + STORE_LAYOUT_DOOR_LEAF / 2, VESTIBULE_DOOR.to],
    [0, 1],
    VESTIBULE_LEAF_WIDTH,
    { glass: true },
  ),
];

// 門片收進兩側時要跨過窗邊吧台末端，得貼在吧台外緣與牆面玻璃之間
const ENTRANCE_DOOR_LINE =
  WINDOW_COUNTER_Z + WINDOW_COUNTER_DEPTH + STORE_LAYOUT_DOOR_LEAF / 2;
const ENTRANCE_LEAF_WIDTH = ENTRANCE.width / 2;

export const STORE_LAYOUT_DOORS = [
  ...STORE_LAYOUT_RESTROOM_FLOORS.flatMap(restroomDoors),
  slideDoor(
    "ground",
    [ENTRANCE.x, ENTRANCE_DOOR_LINE],
    [-1, 0],
    ENTRANCE_LEAF_WIDTH,
    { glass: true },
  ),
  slideDoor(
    "ground",
    [ENTRANCE.x + ENTRANCE.width, ENTRANCE_DOOR_LINE],
    [1, 0],
    ENTRANCE_LEAF_WIDTH,
    { glass: true },
  ),
  slideDoor(
    "ground",
    [STORE_LAYOUT_ROOM.width - STORE_LAYOUT_DOOR_LEAF, DRIVE_THRU_WINDOW.from],
    [0, -1],
    DRIVE_THRU_WINDOW.to - DRIVE_THRU_WINDOW.from,
    {
      bottom: DRIVE_THRU_WINDOW.bottom,
      glass: true,
      height: DRIVE_THRU_WINDOW.top - DRIVE_THRU_WINDOW.bottom,
    },
  ),
  ...ROOF_DOORS,
];

export const STORE_LAYOUT_SLAB_OPENINGS = [
  STORE_LAYOUT_STAIRWELL,
  ELEVATOR_SHAFT,
];

const slabBands = [
  ...new Set([
    0,
    STORE_LAYOUT_ROOM.depth,
    ...STORE_LAYOUT_SLAB_OPENINGS.flatMap(({ depth, z }) => [z, z + depth]),
  ]),
].sort((a, b) => a - b);

export const STORE_LAYOUT_SLAB_PANELS = slabBands
  .slice(1)
  .flatMap((to, index) => {
    const from = slabBands[index];
    const cuts = STORE_LAYOUT_SLAB_OPENINGS.filter(
      ({ depth, z }) => z < to && z + depth > from,
    ).sort((a, b) => a.x - b.x);
    const panels: { depth: number; width: number; x: number; z: number }[] = [];
    let x = 0;

    for (const cut of cuts) {
      if (cut.x > x)
        panels.push({ depth: to - from, width: cut.x - x, x, z: from });
      x = Math.max(x, cut.x + cut.width);
    }

    if (x < STORE_LAYOUT_ROOM.width)
      panels.push({
        depth: to - from,
        width: STORE_LAYOUT_ROOM.width - x,
        x,
        z: from,
      });

    return panels;
  });

export const STORE_LAYOUT_STAIR_GUARD_HEIGHT = 0.9;

const STAIR_GUARD_THICKNESS = 0.08;

// 二樓前緣左半是往上的梯段入口、右半是出梯口，補上護欄會把樓梯封死；屋頂三面由梯間屋牆圍住，只剩前緣上行梯段那半邊要擋
export const STORE_LAYOUT_STAIR_GUARDS = [
  {
    depth: STORE_LAYOUT_STAIRWELL.depth,
    floor: "upper" as const,
    width: STAIR_GUARD_THICKNESS,
    x: STORE_LAYOUT_STAIRWELL.x - STAIR_GUARD_THICKNESS,
    z: STORE_LAYOUT_STAIRWELL.z,
  },
  {
    depth: STORE_LAYOUT_STAIRWELL.depth,
    floor: "upper" as const,
    width: STAIR_GUARD_THICKNESS,
    x: STORE_LAYOUT_STAIRWELL.x + STORE_LAYOUT_STAIRWELL.width,
    z: STORE_LAYOUT_STAIRWELL.z,
  },
  {
    depth: STAIR_GUARD_THICKNESS,
    floor: "upper" as const,
    width: STORE_LAYOUT_STAIRWELL.width,
    x: STORE_LAYOUT_STAIRWELL.x,
    z: STORE_LAYOUT_STAIRWELL.z + STORE_LAYOUT_STAIRWELL.depth,
  },
  {
    depth: STAIR_GUARD_THICKNESS,
    floor: "roof" as const,
    width: STAIR_FLIGHT_WIDTH,
    x: STORE_LAYOUT_STAIRWELL.x,
    z: STORE_LAYOUT_STAIRWELL.z - STAIR_GUARD_THICKNESS,
  },
];

export const STORE_LAYOUT_FLOOR_BASE = Object.fromEntries(
  STORE_LAYOUT_FLOORS.map((floor, index) => [
    floor,
    index * STORE_LAYOUT_FLOOR_HEIGHT,
  ]),
) as Record<(typeof STORE_LAYOUT_FLOORS)[number], number>;

export const STORE_LAYOUT_FLOOR_ENTRY = {
  ground: STORE_LAYOUT_AVATAR.start,
  upper: STORE_LAYOUT_STAIR_EXIT,
  roof: STORE_LAYOUT_STAIR_EXIT,
} as const satisfies Record<
  (typeof STORE_LAYOUT_FLOORS)[number],
  { x: number; z: number }
>;
