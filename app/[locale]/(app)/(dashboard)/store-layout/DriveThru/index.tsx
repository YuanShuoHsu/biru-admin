"use client";

import { useTranslations } from "next-intl";
import { useMemo, useRef } from "react";

import {
  STORE_LAYOUT_DRIVE_THRU,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SLAB_THICKNESS,
} from "@/constants/storeLayout";

import { grey } from "@mui/material/colors";

import { Edges } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import {
  BufferGeometry,
  Float32BufferAttribute,
  type Group,
  Path,
  Shape,
  Vector2,
} from "three";

import SpriteLabel from "../SpriteLabel";
import { ghostEdge, ghostSurface } from "../ghost";
import {
  DRIVE_THRU_CAR,
  DRIVE_THRU_CORNERS,
  advanceDriveThru,
  createDriveThruState,
  poseAt,
} from "./motion";

const { arrowDistances, crossing, curb, laneWidth, stopLines, turnRadius } =
  STORE_LAYOUT_DRIVE_THRU;

const { back, front, left, right } = DRIVE_THRU_CORNERS;

const ASPHALT = "#3b3f44";
const CONCRETE = grey[400];
const GRASS = "#6f8f4e";
const MARKING = grey[50];

// 室內地板頂面在 0，室外各層都壓在它底下，建築內不會透出來
const SITE_TOP = -0.03;
const APRON_TOP = -0.02;
const ASPHALT_TOP = -0.01;
const MARKING_TOP = -0.002;
const SITE_MARGIN = 4;
const CORNER_SEGMENTS = 16;

const STOP_LINE_DEPTH = 0.3;
const ARROW_SHAFT = { depth: 1.6, width: 0.2 } as const;
const ARROW_HEAD_RADIUS = 0.55;
const LABEL_LIFT = 0.3;

const CAR_PAINT = "#f4f4f2";
const CAR_GLASS = "#10161b";
const TIRE = grey[900];
const RIM = grey[400];
const TRIM = grey[900];
const HEADLIGHT = "#fffdf5";
const TAILLIGHT = "#d32f2f";

const ARCH_RADIUS = 0.42;
const ARCH_INSET = 0.55;
const LOFT_SECTIONS = 72;
const LOFT_RING = 40;
const BODY_ROUNDNESS = 5;
const GLASS_ROUNDNESS = 4;
const TIRE_WIDTH = 0.24;
const TIRE_INSET = 0.14;
const RIM_RADIUS = 0.22;
const HEADLIGHT_BOX = { depth: 0.12, height: 0.05, width: 0.34 } as const;
const HEADLIGHT_SPREAD = 0.62;
const TAILLIGHT_BOX = { depth: 0.08, height: 0.06, width: 1.5 } as const;
const MIRROR = { depth: 0.12, height: 0.1, width: 0.14 } as const;

const halfLane = laneWidth / 2;

const yawOf = (headingX: number, headingZ: number) =>
  Math.atan2(-headingX, -headingZ);

const roundedLoop = (radius: number) => {
  const corners: [number, number, number][] = [
    [right, front, 0],
    [left, front, Math.PI / 2],
    [left, back, Math.PI],
    [right, back, (3 * Math.PI) / 2],
  ];

  return corners.flatMap(([x, z, start]) =>
    Array.from({ length: CORNER_SEGMENTS + 1 }, (_, index) => {
      const angle = start + ((Math.PI / 2) * index) / CORNER_SEGMENTS;

      return new Vector2(
        x + radius * Math.cos(angle),
        -(z + radius * Math.sin(angle)),
      );
    }),
  );
};

const flat = { "rotation-x": -Math.PI / 2 } as const;

const WHEELS = [-1, 1].flatMap((side) =>
  [-1, 1].map(
    (end) =>
      [
        side * (DRIVE_THRU_CAR.width / 2 - TIRE_INSET),
        (end * DRIVE_THRU_CAR.wheelBase) / 2,
      ] as const,
  ),
);

const { length, wheelBase, wheelRadius, width } = DRIVE_THRU_CAR;
const axle = wheelBase / 2;
const nose = -length / 2;
const tail = length / 2;

type Keys = [position: number, value: number][];

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1);

  return t * t * (3 - 2 * t);
};

const sample = (keys: Keys, position: number) => {
  const next = keys.findIndex(([at]) => at >= position);

  if (next <= 0) return keys[next === 0 ? 0 : keys.length - 1][1];

  const [fromAt, fromValue] = keys[next - 1];
  const [toAt, toValue] = keys[next];

  return fromValue + (toValue - fromValue) * smoothstep(fromAt, toAt, position);
};

// 車頭朝 -z，數值參考 Model 3 側視與俯視比例
const BODY_TOP: Keys = [
  [nose, 0.56],
  [nose + 0.12, 0.66],
  [-1.9, 0.74],
  [-1.2, 0.82],
  [-0.8, 0.9],
  [1.5, 0.95],
  [2.05, 0.98],
  [tail - 0.06, 0.86],
  [tail, 0.74],
];

const BODY_BOTTOM: Keys = [
  [nose, 0.3],
  [nose + 0.16, 0.18],
  [tail - 0.16, 0.2],
  [tail, 0.34],
];

const HALF_WIDTH: Keys = [
  [nose, 0.72],
  [nose + 0.26, 0.86],
  [-1.4, width / 2],
  [1.4, width / 2],
  [tail - 0.26, 0.88],
  [tail, 0.78],
];

const ROOF: Keys = [
  [-0.95, 0.9],
  [-0.2, 1.3],
  [0.25, DRIVE_THRU_CAR.height],
  [0.6, DRIVE_THRU_CAR.height],
  [1.3, 1.25],
  [1.95, 0.97],
];

const GLASS_OVERLAP = 0.02;
const GLASS_BELT_WIDTH = 0.93;
const GLASS_ROOF_WIDTH = 0.66;

const archBottom = (position: number) =>
  Math.max(
    ...[-axle, axle].map((center) => {
      const offset = Math.abs(position - center);

      return offset < ARCH_RADIUS
        ? wheelRadius + Math.sqrt(ARCH_RADIUS ** 2 - offset ** 2)
        : 0;
    }),
  );

interface Section {
  bottom: number;
  bottomWidth: number;
  top: number;
  topWidth: number;
}

// 沿車長取超橢圓斷面串接成網格，車身才有收腰與圓角，而不是側面擠出的平板
const loft = (
  from: number,
  to: number,
  sectionAt: (position: number) => Section,
  roundness: number,
  arches: boolean,
) => {
  const positions: number[] = [];
  const indices: number[] = [];
  const power = 2 / roundness;

  for (let index = 0; index <= LOFT_SECTIONS; index++) {
    const position = from + ((to - from) * index) / LOFT_SECTIONS;
    const { bottom, bottomWidth, top, topWidth } = sectionAt(position);
    const middle = (top + bottom) / 2;
    const half = (top - bottom) / 2;
    const arch = arches ? archBottom(position) : 0;

    for (let step = 0; step < LOFT_RING; step++) {
      const angle = (2 * Math.PI * step) / LOFT_RING;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const y = middle + half * Math.sign(sin) * Math.abs(sin) ** power;
      const span =
        bottomWidth +
        (topWidth - bottomWidth) * ((y - bottom) / (top - bottom));
      const x = span * Math.sign(cos) * Math.abs(cos) ** power;

      positions.push(
        x,
        Math.abs(x) > ARCH_INSET ? Math.max(y, arch) : y,
        position,
      );
    }
  }

  for (let index = 0; index < LOFT_SECTIONS; index++)
    for (let step = 0; step < LOFT_RING; step++) {
      const a = index * LOFT_RING + step;
      const b = index * LOFT_RING + ((step + 1) % LOFT_RING);
      const c = a + LOFT_RING;
      const d = b + LOFT_RING;

      indices.push(a, b, c, b, d, c);
    }

  [0, LOFT_SECTIONS].forEach((index, end) => {
    const ring = index * LOFT_RING;
    const center = positions.length / 3;
    let [x, y, z] = [0, 0, 0];

    for (let step = 0; step < LOFT_RING; step++) {
      x += positions[(ring + step) * 3];
      y += positions[(ring + step) * 3 + 1];
      z += positions[(ring + step) * 3 + 2];
    }

    positions.push(x / LOFT_RING, y / LOFT_RING, z / LOFT_RING);

    for (let step = 0; step < LOFT_RING; step++) {
      const a = ring + step;
      const b = ring + ((step + 1) % LOFT_RING);

      indices.push(...(end ? [center, a, b] : [center, b, a]));
    }
  });

  const geometry = new BufferGeometry();

  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

const bodyGeometry = () =>
  loft(
    nose,
    tail,
    (position) => {
      const halfWidth = sample(HALF_WIDTH, position);

      return {
        bottom: sample(BODY_BOTTOM, position),
        bottomWidth: halfWidth * 0.94,
        top: sample(BODY_TOP, position),
        topWidth: halfWidth * 0.97,
      };
    },
    BODY_ROUNDNESS,
    true,
  );

const glassGeometry = () =>
  loft(
    ROOF[0][0],
    ROOF[ROOF.length - 1][0],
    (position) => {
      const halfWidth = sample(HALF_WIDTH, position);

      return {
        bottom: sample(BODY_TOP, position) - GLASS_OVERLAP,
        bottomWidth: halfWidth * GLASS_BELT_WIDTH,
        top: Math.max(sample(ROOF, position), sample(BODY_TOP, position)),
        topWidth: halfWidth * GLASS_ROOF_WIDTH,
      };
    },
    GLASS_ROUNDNESS,
    false,
  );

const Car = ({ ghost, realistic }: { ghost: boolean; realistic: boolean }) => {
  const stateRef = useRef(createDriveThruState());
  const carRef = useRef<Group>(null);
  const wheelRefs = useRef<(Group | null)[]>([]);

  const body = useMemo(() => bodyGeometry(), []);
  const glass = useMemo(() => glassGeometry(), []);

  useFrame((_, delta) => {
    const state = stateRef.current;

    advanceDriveThru(state, delta);

    const { headingX, headingZ, x, z } = poseAt(state.distance);
    const spin = -state.odometer / wheelRadius;

    carRef.current?.position.set(x, 0, z);
    carRef.current?.rotation.set(0, yawOf(headingX, headingZ), 0);
    wheelRefs.current.forEach((wheel) => wheel?.rotation.set(spin, 0, 0));
  });

  return (
    <group ref={carRef}>
      <mesh castShadow={realistic && !ghost} geometry={body}>
        <meshPhysicalMaterial
          {...ghostSurface(ghost)}
          clearcoat={1}
          clearcoatRoughness={0.1}
          color={CAR_PAINT}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>
      <mesh castShadow={realistic && !ghost} geometry={glass}>
        <meshPhysicalMaterial
          {...ghostSurface(ghost)}
          clearcoat={1}
          color={CAR_GLASS}
          metalness={0.5}
          roughness={0.08}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[
              side * HEADLIGHT_SPREAD,
              0.56,
              -length / 2 + HEADLIGHT_BOX.depth / 2,
            ]}
          >
            <boxGeometry
              args={[
                HEADLIGHT_BOX.width,
                HEADLIGHT_BOX.height,
                HEADLIGHT_BOX.depth,
              ]}
            />
            <meshStandardMaterial
              {...ghostSurface(ghost)}
              color={HEADLIGHT}
              emissive={HEADLIGHT}
              emissiveIntensity={1.2}
            />
          </mesh>
          <mesh
            castShadow={realistic && !ghost}
            position={[side * (width / 2 + MIRROR.width / 2), 0.98, -0.7]}
          >
            <boxGeometry args={[MIRROR.width, MIRROR.height, MIRROR.depth]} />
            <meshStandardMaterial
              {...ghostSurface(ghost)}
              color={TRIM}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.78, length / 2 - TAILLIGHT_BOX.depth / 2]}>
        <boxGeometry
          args={[
            TAILLIGHT_BOX.width,
            TAILLIGHT_BOX.height,
            TAILLIGHT_BOX.depth,
          ]}
        />
        <meshStandardMaterial
          {...ghostSurface(ghost)}
          color={TAILLIGHT}
          emissive={TAILLIGHT}
          emissiveIntensity={1}
        />
      </mesh>
      {WHEELS.map(([x, z], index) => (
        <group
          key={`${x}-${z}`}
          position={[x, wheelRadius, z]}
          ref={(wheel) => {
            wheelRefs.current[index] = wheel;
          }}
        >
          <mesh castShadow={realistic && !ghost} rotation-z={Math.PI / 2}>
            <cylinderGeometry
              args={[wheelRadius, wheelRadius, TIRE_WIDTH, 24]}
            />
            <meshStandardMaterial
              {...ghostSurface(ghost)}
              color={TIRE}
              roughness={0.9}
            />
          </mesh>
          <mesh rotation-z={Math.PI / 2}>
            <cylinderGeometry
              args={[RIM_RADIUS, RIM_RADIUS, TIRE_WIDTH + 0.01, 24]}
            />
            <meshStandardMaterial
              {...ghostSurface(ghost)}
              color={RIM}
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface DriveThruProps {
  ghost: boolean;
  realistic: boolean;
  showLabels: boolean;
}

const DriveThru = ({ ghost, realistic, showLabels }: DriveThruProps) => {
  const tStoreLayout = useTranslations("storeLayout");

  // 草地、車道、內圈地面、建築彼此不重疊，從底下往上看才各自露出，不會被草地整片蓋住
  const { apron, lane, site } = useMemo(() => {
    const inner = roundedLoop(turnRadius - halfLane);
    const outer = roundedLoop(turnRadius + halfLane);
    const reach = turnRadius + halfLane + SITE_MARGIN;

    const ground = new Shape([
      new Vector2(left - reach, -(back - reach)),
      new Vector2(right + reach, -(back - reach)),
      new Vector2(right + reach, -(front + reach)),
      new Vector2(left - reach, -(front + reach)),
    ]);

    ground.holes.push(new Path(outer));

    const ring = new Shape(outer);

    ring.holes.push(new Path(inner));

    const courtyard = new Shape(inner);

    courtyard.holes.push(
      new Path([
        new Vector2(0, 0),
        new Vector2(0, -STORE_LAYOUT_ROOM.depth),
        new Vector2(STORE_LAYOUT_ROOM.width, -STORE_LAYOUT_ROOM.depth),
        new Vector2(STORE_LAYOUT_ROOM.width, 0),
      ]),
    );

    return { apron: courtyard, lane: ring, site: ground };
  }, []);

  const slab = {
    bevelEnabled: false,
    curveSegments: CORNER_SEGMENTS,
    depth: STORE_LAYOUT_SLAB_THICKNESS,
  };

  const crossingZ = front + turnRadius - halfLane;
  const stripeCount = Math.floor(laneWidth / (crossing.stripe * 2));
  const stripeSpan = crossing.stripe * (stripeCount * 2 - 1);

  return (
    <>
      <mesh
        position-y={SITE_TOP - STORE_LAYOUT_SLAB_THICKNESS}
        receiveShadow
        {...flat}
      >
        <extrudeGeometry args={[site, slab]} />
        <meshStandardMaterial
          {...ghostSurface(ghost)}
          color={GRASS}
          roughness={1}
        />
      </mesh>
      <mesh
        position-y={APRON_TOP - STORE_LAYOUT_SLAB_THICKNESS}
        receiveShadow
        {...flat}
      >
        <extrudeGeometry args={[apron, slab]} />
        <meshStandardMaterial
          {...ghostSurface(ghost)}
          color={CONCRETE}
          roughness={0.9}
        />
      </mesh>
      <mesh
        position-y={ASPHALT_TOP - STORE_LAYOUT_SLAB_THICKNESS}
        receiveShadow
        {...flat}
      >
        <extrudeGeometry args={[lane, slab]} />
        <meshStandardMaterial
          {...ghostSurface(ghost)}
          color={ASPHALT}
          roughness={0.95}
        />
      </mesh>
      <mesh
        position={[
          curb.x + curb.width / 2,
          curb.height / 2,
          (back + front) / 2,
        ]}
        receiveShadow
      >
        <boxGeometry args={[curb.width, curb.height, front - back]} />
        <meshStandardMaterial
          {...ghostSurface(ghost)}
          color={CONCRETE}
          roughness={0.9}
        />
        {!realistic && <Edges color={grey[700]} {...ghostEdge(ghost)} />}
      </mesh>
      {stopLines.map((z) => (
        <mesh
          key={z}
          position={[right + turnRadius, MARKING_TOP, z - STOP_LINE_DEPTH / 2]}
          {...flat}
        >
          <planeGeometry args={[laneWidth, STOP_LINE_DEPTH]} />
          <meshBasicMaterial
            {...ghostSurface(ghost)}
            color={MARKING}
            toneMapped={false}
          />
        </mesh>
      ))}
      {Array.from({ length: stripeCount }, (_, index) => (
        <mesh
          key={index}
          position={[
            (crossing.from + crossing.to) / 2,
            MARKING_TOP,
            crossingZ +
              (laneWidth - stripeSpan) / 2 +
              crossing.stripe * (index * 2 + 0.5),
          ]}
          {...flat}
        >
          <planeGeometry
            args={[crossing.to - crossing.from, crossing.stripe]}
          />
          <meshBasicMaterial
            {...ghostSurface(ghost)}
            color={MARKING}
            toneMapped={false}
          />
        </mesh>
      ))}
      {arrowDistances.map((distance) => {
        const { headingX, headingZ, x, z } = poseAt(distance);

        return (
          <group
            key={distance}
            position={[x, MARKING_TOP, z]}
            rotation-y={yawOf(headingX, headingZ)}
          >
            <mesh position-z={ARROW_SHAFT.depth / 2} {...flat}>
              <planeGeometry args={[ARROW_SHAFT.width, ARROW_SHAFT.depth]} />
              <meshBasicMaterial
                {...ghostSurface(ghost)}
                color={MARKING}
                toneMapped={false}
              />
            </mesh>
            <mesh {...flat}>
              <circleGeometry args={[ARROW_HEAD_RADIUS, 3, Math.PI / 2]} />
              <meshBasicMaterial
                {...ghostSurface(ghost)}
                color={MARKING}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
      <Car ghost={ghost} realistic={realistic} />
      {showLabels && !ghost && (
        <SpriteLabel
          position={[right + turnRadius, LABEL_LIFT, front - 2]}
          text={tStoreLayout("items.driveThruLane")}
        />
      )}
    </>
  );
};

export default DriveThru;
