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
  teal,
} from "@mui/material/colors";

export const STORE_LAYOUT_ORGANIZATION_SLUG = "biru";

export const STORE_LAYOUT_ROOM = {
  depth: 21,
  height: 2.8,
  width: 15.75,
} as const;

export const STORE_LAYOUT_FLOORS = ["ground", "upper"] as const;

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

const TWO_TOP = { depth: 0.7, width: 0.7 } as const;
const FOUR_TOP = { depth: 0.8, width: 1.4 } as const;

const TABLE_HEIGHT = 0.75;

const tableColumn = (
  floor: LayoutFloor,
  { depth, width }: { depth: number; width: number },
  x: number,
  rows: number[],
) =>
  rows.map((z) => ({
    depth,
    elevation: 0,
    floor,
    height: TABLE_HEIGHT,
    kind: "seat" as const,
    label: "table" as const,
    width,
    x,
    z,
  }));

const WINDOW_COUNTER_Z = STORE_LAYOUT_ROOM.depth - 0.5;
const WINDOW_COUNTER_DEPTH = 0.45;
const WINDOW_COUNTER_HEIGHT = 1.05;

const windowCounter = (floor: LayoutFloor, from: number, to: number) => ({
  depth: WINDOW_COUNTER_DEPTH,
  elevation: 0,
  floor,
  height: WINDOW_COUNTER_HEIGHT,
  kind: "seat" as const,
  label: "windowCounter" as const,
  width: to - from,
  x: from,
  z: WINDOW_COUNTER_Z,
});

// 兩層廁所疊在同一位置，給排水管才能共用同一組立管
const restroom = <Label extends "accessibleRestroom" | "restroom">(
  floor: LayoutFloor,
  label: Label,
) => ({
  depth: 2.4,
  elevation: 0,
  floor,
  height: STORE_LAYOUT_ROOM.height,
  kind: "restroom" as const,
  label,
  width: 2.4,
  x: 0,
  z: 9.2,
});

const GROUND_WINDOW_COUNTERS = [
  windowCounter("ground", 0.3, 6.1),
  windowCounter("ground", 9.65, 15.45),
];

const UPPER_WINDOW_COUNTERS = [windowCounter("upper", 0.3, 15.45)];

const ENTRANCE = { height: 2.1, width: 2, x: 6.9 } as const;

const PLANT_SIZE = 0.5;
const PLANT_HEIGHT = 1.2;

const plant = (floor: LayoutFloor, x: number, z: number) => ({
  depth: PLANT_SIZE,
  elevation: 0,
  floor,
  height: PLANT_HEIGHT,
  kind: "plant" as const,
  label: "plant" as const,
  width: PLANT_SIZE,
  x,
  z,
});

const PLANTS = [
  plant("ground", 6.25, 20.4),
  plant("ground", 9.05, 20.4),
  plant("upper", 13.7, 0.1),
  plant("upper", 0.1, 6.5),
];

const GROUND_TABLES = [
  ...tableColumn("ground", FOUR_TOP, 0.1, [12.8, 15.2, 17.6]),
  ...tableColumn("ground", FOUR_TOP, 2.7, [12.8, 15.2, 17.6]),
  ...tableColumn("ground", TWO_TOP, 5.3, [10.2, 12.65, 15.05, 17.45]),
  ...tableColumn("ground", TWO_TOP, 9.75, [7.9, 10.3, 12.65, 15.05, 17.45]),
  ...tableColumn("ground", FOUR_TOP, 11.65, [10.5, 12.9, 15.3, 17.7]),
  ...tableColumn("ground", FOUR_TOP, 14.25, [11.1, 13.5, 15.9]),
];

const UPPER_TABLES = [
  ...tableColumn("upper", FOUR_TOP, 0.1, [1.1, 3.5, 12.8, 15.2, 17.6]),
  ...tableColumn("upper", FOUR_TOP, 2.7, [1.1, 3.5, 5.9, 12.8, 15.2, 17.6]),
  ...tableColumn(
    "upper",
    TWO_TOP,
    5.3,
    [1.15, 3.55, 5.95, 8.35, 12.85, 15.25, 17.65],
  ),
  ...tableColumn(
    "upper",
    FOUR_TOP,
    7.175,
    [1.1, 3.5, 5.9, 8.3, 12.8, 15.2, 17.6],
  ),
  ...tableColumn(
    "upper",
    TWO_TOP,
    9.75,
    [1.15, 3.55, 5.95, 8.35, 12.85, 15.25, 17.65],
  ),
  ...tableColumn("upper", FOUR_TOP, 11.65, [1.8, 12.8, 15.2, 17.6]),
  ...tableColumn("upper", FOUR_TOP, 14.25, [12.8, 15.2, 17.6]),
];

export const STORE_LAYOUT_ITEMS = [
  {
    depth: 0.7,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "wash",
    label: "sink",
    width: 2.4,
    x: 0.3,
    z: 0.1,
  },
  {
    depth: 0.4,
    elevation: 1.5,
    floor: "ground",
    height: 0.8,
    kind: "wash",
    label: "cleanShelf",
    width: 2.4,
    x: 0.3,
    z: 0.1,
  },
  {
    depth: 0.8,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "prep",
    label: "prepTable",
    width: 2.6,
    x: 3,
    z: 0.1,
  },
  {
    depth: 0.8,
    elevation: 0.75,
    floor: "ground",
    height: 1,
    kind: "heat",
    label: "oven",
    width: 0.85,
    x: 5.9,
    z: 0.1,
  },
  {
    depth: 0.7,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "heat",
    label: "stove",
    width: 1.2,
    x: 7,
    z: 0.1,
  },
  {
    depth: 1,
    elevation: 2,
    floor: "ground",
    height: 0.5,
    kind: "heat",
    label: "rangeHood",
    width: 2.5,
    x: 5.8,
    z: 0.1,
  },
  {
    depth: 0.8,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "prep",
    label: "prepTable",
    width: 2.6,
    x: 8.5,
    z: 0.1,
  },
  {
    depth: 0.8,
    elevation: 0,
    floor: "ground",
    height: 2,
    kind: "cold",
    label: "fridge",
    width: 0.8,
    x: 11.4,
    z: 0.1,
  },
  {
    depth: 0.8,
    elevation: 0,
    floor: "ground",
    height: 2,
    kind: "cold",
    label: "fridge",
    width: 0.8,
    x: 12.3,
    z: 0.1,
  },
  {
    depth: 0.8,
    elevation: 0,
    floor: "ground",
    height: 1.9,
    kind: "cold",
    label: "freezer",
    width: 0.8,
    x: 13.3,
    z: 0.1,
  },
  {
    depth: 0.8,
    elevation: 0,
    floor: "ground",
    height: 1.9,
    kind: "cold",
    label: "freezer",
    width: 0.8,
    x: 14.2,
    z: 0.1,
  },
  {
    depth: 1.8,
    elevation: 0,
    floor: "ground",
    height: 2,
    kind: "storage",
    label: "storageShelf",
    width: 0.8,
    x: 0.1,
    z: 1.4,
  },
  {
    depth: 0.45,
    elevation: 0,
    floor: "ground",
    height: 0.85,
    kind: "wash",
    label: "handSink",
    width: 0.45,
    x: 2.85,
    z: 2.2,
  },
  {
    depth: 1.8,
    elevation: 0,
    floor: "ground",
    height: 2,
    kind: "storage",
    label: "storageShelf",
    width: 0.8,
    x: 14.85,
    z: 1.4,
  },
  {
    depth: 0.45,
    elevation: 0,
    floor: "ground",
    height: 0.85,
    kind: "wash",
    label: "handSink",
    width: 0.45,
    x: 15.2,
    z: 3.3,
  },
  {
    depth: 0.8,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "bar",
    label: "workCounter",
    width: 5.8,
    x: 3.4,
    z: 2.1,
  },
  {
    depth: 0.8,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "bar",
    label: "workCounter",
    width: 3.8,
    x: 10.1,
    z: 2.1,
  },
  {
    depth: 0.34,
    elevation: 0.9,
    floor: "ground",
    height: 0.63,
    kind: "equipment",
    label: "grinder",
    width: 0.24,
    x: 10.3,
    z: 2.2,
  },
  {
    depth: 0.55,
    elevation: 0.9,
    floor: "ground",
    height: 0.55,
    kind: "equipment",
    label: "espressoMachine",
    width: 0.8,
    x: 10.8,
    z: 2.2,
  },
  {
    depth: 0.35,
    elevation: 1.6,
    floor: "ground",
    height: 0.3,
    kind: "bar",
    label: "cupShelf",
    width: 2.5,
    x: 10.3,
    z: 2.1,
  },
  {
    depth: 0.17,
    elevation: 0.9,
    floor: "ground",
    height: 0.196,
    kind: "equipment",
    label: "kettle",
    width: 0.28,
    x: 11.9,
    z: 2.3,
  },
  {
    depth: 0.3,
    elevation: 0.9,
    floor: "ground",
    height: 0.45,
    kind: "equipment",
    label: "blender",
    width: 0.25,
    x: 12.5,
    z: 2.2,
  },
  {
    depth: 0.52,
    elevation: 0.9,
    floor: "ground",
    height: 0.695,
    kind: "equipment",
    label: "iceMachine",
    width: 0.35,
    x: 13.2,
    z: 2.15,
  },
  {
    depth: 0.7,
    elevation: 0,
    floor: "ground",
    height: 1.1,
    kind: "bar",
    label: "frontCounter",
    width: 1.6,
    x: 1,
    z: 4.1,
  },
  {
    depth: 0.7,
    elevation: 0,
    floor: "ground",
    height: 1.2,
    kind: "cold",
    label: "pastryCase",
    width: 1.8,
    x: 2.6,
    z: 4.1,
  },
  {
    depth: 0.7,
    elevation: 0,
    floor: "ground",
    height: 1.1,
    kind: "front",
    label: "orderCounter",
    width: 2,
    x: 4.4,
    z: 4.1,
  },
  {
    depth: 0.1,
    elevation: 1.1,
    floor: "ground",
    height: 0.35,
    kind: "equipment",
    label: "orderScreen",
    width: 0.4,
    x: 5.2,
    z: 4.2,
  },
  {
    depth: 0.05,
    elevation: 2,
    floor: "ground",
    height: 0.6,
    kind: "equipment",
    label: "menuBoard",
    width: 3,
    x: 3.4,
    z: 4.4,
  },
  {
    depth: 0.7,
    elevation: 0,
    floor: "ground",
    height: 1.1,
    kind: "bar",
    label: "frontCounter",
    width: 3.4,
    x: 6.4,
    z: 4.1,
  },
  {
    depth: 0.7,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "front",
    label: "passCounter",
    width: 1.8,
    x: 9.8,
    z: 4.1,
  },
  {
    depth: 0.05,
    elevation: 2,
    floor: "ground",
    height: 0.5,
    kind: "equipment",
    label: "pickupScreen",
    width: 1,
    x: 10.2,
    z: 4.4,
  },
  {
    depth: 0.7,
    elevation: 0,
    floor: "ground",
    height: 1.1,
    kind: "bar",
    label: "frontCounter",
    width: 4.15,
    x: 11.6,
    z: 4.1,
  },
  {
    depth: 1.2,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "wash",
    label: "returnCounter",
    width: 0.7,
    x: 0.1,
    z: 5.4,
  },
  {
    depth: 2,
    elevation: 0,
    floor: "ground",
    height: 0.9,
    kind: "front",
    label: "selfService",
    width: 0.6,
    x: 13.3,
    z: 7.4,
  },
  {
    depth: 0.1,
    elevation: 0,
    floor: "ground",
    height: ENTRANCE.height,
    kind: "front",
    label: "entrance",
    width: ENTRANCE.width,
    x: ENTRANCE.x,
    z: STORE_LAYOUT_ROOM.depth - 0.1,
  },
  {
    depth: 1,
    elevation: 0,
    floor: "ground",
    height: 0.02,
    kind: "front",
    label: "entranceMat",
    width: ENTRANCE.width,
    x: ENTRANCE.x,
    z: STORE_LAYOUT_ROOM.depth - 1.1,
  },
  {
    depth: 0.7,
    elevation: 0,
    floor: "upper",
    height: 0.9,
    kind: "wash",
    label: "returnCounter",
    width: 1.25,
    x: 14.4,
    z: 0.1,
  },
  restroom("ground", "accessibleRestroom"),
  ...GROUND_WINDOW_COUNTERS,
  ...GROUND_TABLES,
  restroom("upper", "restroom"),
  ...UPPER_WINDOW_COUNTERS,
  ...UPPER_TABLES,
  ...PLANTS,
] as const;

const CHAIR_SIZE = 0.42;
const CHAIR_GAP = 0.05;
const CHAIR_SEAT_HEIGHT = 0.45;
const CHAIR_BACK_HEIGHT = 0.4;
const CHAIR_BACK_DEPTH = 0.05;
const STOOL_SIZE = 0.38;
const STOOL_HEIGHT = 0.75;
const STOOL_PITCH = 0.6;

const chair = (floor: LayoutFloor, x: number, z: number, backZ: number) => [
  {
    depth: CHAIR_SIZE,
    elevation: 0,
    floor,
    height: CHAIR_SEAT_HEIGHT,
    width: CHAIR_SIZE,
    x,
    z,
  },
  {
    depth: CHAIR_BACK_DEPTH,
    elevation: CHAIR_SEAT_HEIGHT,
    floor,
    height: CHAIR_BACK_HEIGHT,
    width: CHAIR_SIZE,
    x,
    z: backZ,
  },
];

const chairPair = (
  floor: LayoutFloor,
  x: number,
  tableZ: number,
  tableDepth: number,
) => {
  const behind = tableZ - CHAIR_GAP - CHAIR_SIZE;
  const ahead = tableZ + tableDepth + CHAIR_GAP;

  return [
    ...chair(floor, x, behind, behind),
    ...chair(floor, x, ahead, ahead + CHAIR_SIZE - CHAIR_BACK_DEPTH),
  ];
};

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

export const STORE_LAYOUT_SEATS = [
  ...[...GROUND_TABLES, ...UPPER_TABLES].flatMap(
    ({ depth, floor, width, x, z }) => {
      const perSide = Math.round(width / TWO_TOP.width);

      return Array.from({ length: perSide }, (_, index) =>
        chairPair(
          floor,
          x + (width / perSide) * (index + 0.5) - CHAIR_SIZE / 2,
          z,
          depth,
        ),
      ).flat();
    },
  ),
  ...[...GROUND_WINDOW_COUNTERS, ...UPPER_WINDOW_COUNTERS].flatMap(
    ({ floor, width, x, z }) =>
      Array.from({ length: Math.floor(width / STOOL_PITCH) }, (_, index) => ({
        depth: STOOL_SIZE,
        elevation: 0,
        floor,
        height: STOOL_HEIGHT,
        width: STOOL_SIZE,
        x: x + STOOL_PITCH * (index + 0.5) - STOOL_SIZE / 2,
        z: z - CHAIR_GAP - STOOL_SIZE,
      })),
  ),
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
  start: { x: STORE_LAYOUT_ROOM.width / 2, z: 20 },
} as const;

export const STORE_LAYOUT_CHARACTERS = {
  person: {
    color: deepOrange[600],
    eye: 1.55,
    followOffset: [0, 1.2, 3.2],
    skin: brown[200],
  },
  cat: {
    belly: grey[50],
    eye: 0.4,
    followOffset: [0, 1.1, 2.6],
    fur: deepOrange[400],
    iris: green[800],
    nose: brown[300],
    stripe: deepOrange[800],
  },
} as const;

export const STORE_LAYOUT_CHARACTER_ORDER = [
  "person",
  "cat",
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

export const STORE_LAYOUT_STAIR_STEPS = [
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

export const STORE_LAYOUT_STAIRWELL = {
  depth: STAIR_FLIGHT_RUN + STAIR_LANDING_DEPTH,
  width: STAIR_WIDTH,
  x: STAIR_X,
  z: STAIR_Z,
} as const;

export const STORE_LAYOUT_STAIR_EXIT = {
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

// 第一段只擋上行梯段那半邊，剩下的半邊是出梯口；補成整寬會把二樓封死，上不去也下不來
export const STORE_LAYOUT_STAIR_GUARDS = [
  {
    depth: STAIR_GUARD_THICKNESS,
    width: STAIR_FLIGHT_WIDTH,
    x: STORE_LAYOUT_STAIRWELL.x,
    z: STORE_LAYOUT_STAIRWELL.z - STAIR_GUARD_THICKNESS,
  },
  {
    depth: STORE_LAYOUT_STAIRWELL.depth,
    width: STAIR_GUARD_THICKNESS,
    x: STORE_LAYOUT_STAIRWELL.x - STAIR_GUARD_THICKNESS,
    z: STORE_LAYOUT_STAIRWELL.z,
  },
  {
    depth: STORE_LAYOUT_STAIRWELL.depth,
    width: STAIR_GUARD_THICKNESS,
    x: STORE_LAYOUT_STAIRWELL.x + STORE_LAYOUT_STAIRWELL.width,
    z: STORE_LAYOUT_STAIRWELL.z,
  },
  {
    depth: STAIR_GUARD_THICKNESS,
    width: STORE_LAYOUT_STAIRWELL.width,
    x: STORE_LAYOUT_STAIRWELL.x,
    z: STORE_LAYOUT_STAIRWELL.z + STORE_LAYOUT_STAIRWELL.depth,
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
} as const satisfies Record<
  (typeof STORE_LAYOUT_FLOORS)[number],
  { x: number; z: number }
>;
