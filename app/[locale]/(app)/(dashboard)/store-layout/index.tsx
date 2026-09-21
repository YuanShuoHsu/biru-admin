"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
  type ComponentRef,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { DoubleSide } from "three";

import Avatar from "./Avatar";
import SpriteLabel from "./SpriteLabel";

import {
  STORE_LAYOUT_CHARACTER_ORDER,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_FILTERS,
  STORE_LAYOUT_FLOOR_HEIGHT,
  STORE_LAYOUT_FOV,
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_KIND_COLORS,
  STORE_LAYOUT_LOOK,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SLAB_PANELS,
  STORE_LAYOUT_SLAB_THICKNESS,
  STORE_LAYOUT_STAIRWELL,
  STORE_LAYOUT_STAIR_GUARDS,
  STORE_LAYOUT_STAIR_GUARD_HEIGHT,
  STORE_LAYOUT_STAIR_STEPS,
  STORE_LAYOUT_TOUCH_MEDIA,
  STORE_LAYOUT_TOUCH_QUERY,
  STORE_LAYOUT_VIEWS,
  STORE_LAYOUT_VIEW_ORDER,
  STORE_LAYOUT_WALLS,
} from "@/constants/storeLayout";

import { Download, Fullscreen, FullscreenExit } from "@mui/icons-material";
import {
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { blueGrey, grey } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

import {
  Edges,
  KeyboardControls,
  type KeyboardControlsEntry,
  Line,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, type RootState } from "@react-three/fiber";

import type {
  StoreLayoutCharacter,
  StoreLayoutFloor,
  StoreLayoutFloorFilter,
  StoreLayoutMove,
  StoreLayoutTouchInput,
  StoreLayoutView,
} from "@/types/storeLayout";

const Joystick = dynamic(() => import("./Joystick"), { ssr: false });

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  transition: theme.transitions.create("background-color"),
}));

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "fullscreen",
})<{ fullscreen: boolean }>(({ fullscreen, theme }) => ({
  position: "relative",
  flex: 1,
  minHeight: 240,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",

  "&:fullscreen": {
    border: "none",
    borderRadius: 0,
  },

  ...(fullscreen && {
    position: "fixed",
    inset: 0,
    border: "none",
    borderRadius: 0,
    zIndex: theme.zIndex.modal,
  }),
}));

const OverlayActions = styled(Stack)(({ theme }) => ({
  position: "absolute",
  right: theme.spacing(1.5),
  bottom: theme.spacing(1.5),
  flexDirection: "row",
  gap: theme.spacing(1),
}));

const OverlayButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.vars.palette.divider}`,
  color: theme.vars.palette.text.primary,
}));

const GridLegend = styled(Stack)(({ theme }) => ({
  position: "absolute",
  bottom: theme.spacing(1.5),
  left: theme.spacing(1.5),
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(0.25, 1),
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create("border-color"),
  pointerEvents: "none",
}));

const GridCellLine = styled("span")({
  width: 24,
  borderTop: `1px solid ${grey[500]}`,
});

const GridSectionLine = styled(GridCellLine)({
  borderTopWidth: 2,
  borderTopColor: grey[700],
});

const KeyboardHint = styled(Typography)({
  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "none",
  },
});

const MOVE_MAP: KeyboardControlsEntry<StoreLayoutMove>[] = [
  { keys: ["ArrowUp", "KeyW"], name: "forward" },
  { keys: ["ArrowDown", "KeyS"], name: "backward" },
  { keys: ["ArrowLeft", "KeyA"], name: "left" },
  { keys: ["ArrowRight", "KeyD"], name: "right" },
  { keys: ["Space"], name: "jump" },
  { keys: ["KeyI"], name: "lookUp" },
  { keys: ["KeyK"], name: "lookDown" },
  { keys: ["KeyJ"], name: "lookLeft" },
  { keys: ["KeyL"], name: "lookRight" },
];

const { pitchLimit } = STORE_LAYOUT_LOOK;

const subscribeFullscreen = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);

  return () => document.removeEventListener("fullscreenchange", onChange);
};

const subscribeNothing = () => () => {};

const savesToPhotoLibrary = (file: File) =>
  window.matchMedia(STORE_LAYOUT_TOUCH_QUERY).matches &&
  Boolean(navigator.canShare?.({ files: [file] }));

const ghostSurface = (ghost: boolean) => ({
  depthWrite: !ghost,
  opacity: ghost ? 0.06 : 1,
  transparent: ghost,
});

const ghostEdge = (ghost: boolean) => ({
  depthWrite: !ghost,
  opacity: ghost ? 0.4 : 1,
  transparent: ghost,
});

const toCentimeters = (value: number) => Math.round(value * 1000) / 10;

type Point = [number, number, number];

const DIMENSION_TICK = 0.12;
const DIMENSION_LABEL_GAP = 0.22;

const shift = (
  [x, y, z]: Point,
  [towardsX, towardsY, towardsZ]: Point,
  distance: number,
): Point => [
  x + towardsX * distance,
  y + towardsY * distance,
  z + towardsZ * distance,
];

const middleOf = (
  [fromX, fromY, fromZ]: Point,
  [toX, toY, toZ]: Point,
): Point => [(fromX + toX) / 2, (fromY + toY) / 2, (fromZ + toZ) / 2];

const ROOM_DIMENSIONS: {
  from: Point;
  key: "width" | "depth" | "height";
  outwards: Point;
  to: Point;
  value: number;
}[] = [
  {
    from: [0, 0, STORE_LAYOUT_ROOM.depth + 0.45],
    key: "width",
    outwards: [0, 0, 1],
    to: [STORE_LAYOUT_ROOM.width, 0, STORE_LAYOUT_ROOM.depth + 0.45],
    value: STORE_LAYOUT_ROOM.width,
  },
  {
    from: [STORE_LAYOUT_ROOM.width + 0.45, 0, 0],
    key: "depth",
    outwards: [1, 0, 0],
    to: [STORE_LAYOUT_ROOM.width + 0.45, 0, STORE_LAYOUT_ROOM.depth],
    value: STORE_LAYOUT_ROOM.depth,
  },
  {
    from: [-0.35, 0, -0.35],
    key: "height",
    outwards: [-1, 0, 0],
    to: [-0.35, STORE_LAYOUT_ROOM.height, -0.35],
    value: STORE_LAYOUT_ROOM.height,
  },
];

const GRID_CELL_SIZE = 1;
const GRID_SECTION_SIZE = 5;

const gridPoints = (step: number, keep: (value: number) => boolean) => {
  const points: Point[] = [];

  for (let x = 0; x <= STORE_LAYOUT_ROOM.width; x += step)
    if (keep(x)) points.push([x, 0, 0], [x, 0, STORE_LAYOUT_ROOM.depth]);

  for (let z = 0; z <= STORE_LAYOUT_ROOM.depth; z += step)
    if (keep(z)) points.push([0, 0, z], [STORE_LAYOUT_ROOM.width, 0, z]);

  return points;
};

const GRID_CELL_POINTS = gridPoints(
  GRID_CELL_SIZE,
  (value) => value % GRID_SECTION_SIZE !== 0,
);

const GRID_SECTION_POINTS = gridPoints(GRID_SECTION_SIZE, () => true);

const ITEM_DIMENSION_OFFSET = 0.06;
const ITEM_DIMENSION_TICK = 0.04;
const ITEM_DIMENSION_LABEL_GAP = 0.1;

const itemDimensions = (width: number, height: number, depth: number) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;
  const outside = halfDepth + ITEM_DIMENSION_OFFSET;
  const beside = halfWidth + ITEM_DIMENSION_OFFSET;

  return [
    {
      from: [-halfWidth, -halfHeight, outside] as Point,
      key: "width" as const,
      outwards: [0, 0, 1] as Point,
      to: [halfWidth, -halfHeight, outside] as Point,
      value: width,
    },
    {
      from: [beside, -halfHeight, -halfDepth] as Point,
      key: "depth" as const,
      outwards: [1, 0, 0] as Point,
      to: [beside, -halfHeight, halfDepth] as Point,
      value: depth,
    },
    {
      from: [-beside, -halfHeight, -outside] as Point,
      key: "height" as const,
      outwards: [-1, 0, 0] as Point,
      to: [-beside, halfHeight, -outside] as Point,
      value: height,
    },
  ];
};

interface DimensionLineProps {
  from: Point;
  labelGap: number;
  outwards: Point;
  text: string;
  tick: number;
  to: Point;
}

const DimensionLine = ({
  from,
  labelGap,
  outwards,
  text,
  tick,
  to,
}: DimensionLineProps) => (
  <>
    <Line
      color={grey[600]}
      depthTest={false}
      lineWidth={1}
      points={[
        from,
        to,
        shift(from, outwards, -tick),
        shift(from, outwards, tick),
        shift(to, outwards, -tick),
        shift(to, outwards, tick),
      ]}
      renderOrder={1}
      segments
    />
    <SpriteLabel
      plain
      position={shift(middleOf(from, to), outwards, labelGap)}
      text={text}
    />
  </>
);

interface StoreLayoutProps {
  empty?: boolean;
}

const StoreLayout = ({ empty }: StoreLayoutProps) => {
  const tStoreLayout = useTranslations("storeLayout");

  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const rootStateRef = useRef<RootState>(null);
  const touchRef = useRef<StoreLayoutTouchInput>({
    jump: false,
    lookSideways: 0,
    lookVertical: 0,
    sideways: 0,
    towards: 0,
  });

  const [canvasElement, setCanvasElement] = useState<HTMLDivElement | null>(
    null,
  );
  const nativeFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenElement),
    () => false,
  );
  const fullscreenSupported = useSyncExternalStore(
    subscribeNothing,
    () => document.fullscreenEnabled,
    () => false,
  );
  const [emulatedFullscreen, setEmulatedFullscreen] = useState(false);

  const fullscreen = nativeFullscreen || emulatedFullscreen;

  const [character, setCharacter] = useState<StoreLayoutCharacter>("person");
  const [floor, setFloor] = useState<StoreLayoutFloor>("ground");
  const [floors, setFloors] = useState<StoreLayoutFloorFilter>("ground");
  const [stairs, setStairs] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [view, setView] = useState<StoreLayoutView>("iso");

  const applyView = (
    nextView: StoreLayoutView,
    nextFloor: StoreLayoutFloor,
  ) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const entry = STORE_LAYOUT_VIEWS[nextView];
    if (!("position" in entry)) return;

    const { position, target } = entry;
    const base = STORE_LAYOUT_FLOOR_BASE[nextFloor];

    controls.object.position.set(position[0], position[1] + base, position[2]);
    controls.target.set(target[0], target[1] + base, target[2]);
    controls.update();
  };

  const handleFloorsChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: StoreLayoutFloorFilter | null,
  ) => {
    if (!value) return;

    setFloors(value);

    if (value === "all") return;

    setFloor(value);
    applyView(view, value);
  };

  const showFloor = (value: StoreLayoutFloor) => {
    setFloor(value);
    setFloors((current) => (current === "all" ? current : value));
  };

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: StoreLayoutView | null,
  ) => {
    if (!value) return;

    applyView(value, floor);
    setView(value);
  };

  const handleCharacterChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: StoreLayoutCharacter | null,
  ) => {
    if (value) setCharacter(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key.startsWith("Arrow") || event.code === "Space")
      event.preventDefault();
  };

  // iPhone Safari 沒有 Element.requestFullscreen，只能改用固定定位鋪滿視窗
  const handleFullscreen = () => {
    if (!fullscreenSupported) {
      setEmulatedFullscreen((on) => !on);
      return;
    }

    if (document.fullscreenElement) void document.exitFullscreen();
    else void canvasElement?.requestFullscreen();
  };

  const handleExport = () => {
    const state = rootStateRef.current;
    if (!state) return;

    state.gl.render(state.scene, state.camera);

    const name = `store-layout-${floors}-${view}.png`;
    const dataUrl = state.gl.domElement.toDataURL("image/png");
    const bytes = Uint8Array.from(
      atob(dataUrl.slice(dataUrl.indexOf(",") + 1)),
      (character) => character.charCodeAt(0),
    );
    const file = new File([bytes], name, { type: "image/png" });

    if (savesToPhotoLibrary(file)) {
      void navigator.share({ files: [file] }).catch(() => {});

      return;
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url));
  };

  const handleShowLabelsChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setShowLabels(checked);
  };

  const handleShowDimensionsChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setShowDimensions(checked);
  };

  return (
    <>
      {!empty && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
          <StyledToggleButtonGroup
            exclusive
            onChange={handleFloorsChange}
            size="small"
            value={floors}
          >
            {STORE_LAYOUT_FLOOR_FILTERS.map((value) => (
              <ToggleButton key={value} value={value}>
                {tStoreLayout(`floors.${value}`)}
              </ToggleButton>
            ))}
          </StyledToggleButtonGroup>
          <StyledToggleButtonGroup
            exclusive
            onChange={handleViewChange}
            size="small"
            value={view}
          >
            {STORE_LAYOUT_VIEW_ORDER.map((value) => (
              <ToggleButton key={value} value={value}>
                {tStoreLayout(`views.${value}`)}
              </ToggleButton>
            ))}
          </StyledToggleButtonGroup>
          <StyledToggleButtonGroup
            exclusive
            onChange={handleCharacterChange}
            size="small"
            value={character}
          >
            {STORE_LAYOUT_CHARACTER_ORDER.map((value) => (
              <ToggleButton key={value} value={value}>
                {tStoreLayout(`characters.${value}`)}
              </ToggleButton>
            ))}
          </StyledToggleButtonGroup>
          <FormControlLabel
            control={
              <Switch checked={showLabels} onChange={handleShowLabelsChange} />
            }
            label={tStoreLayout("showLabels")}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showDimensions}
                onChange={handleShowDimensionsChange}
              />
            }
            label={tStoreLayout("showDimensions")}
          />
          <KeyboardHint color="text.secondary" variant="caption">
            {tStoreLayout("moveHint")}
          </KeyboardHint>
        </Stack>
      )}
      <StyledPaper
        fullscreen={emulatedFullscreen}
        ref={setCanvasElement}
        variant="outlined"
        {...(!empty && { onKeyDown: handleKeyDown, tabIndex: 0 })}
      >
        {empty ? (
          <Typography color="text.secondary" variant="body2">
            {tStoreLayout("empty")}
          </Typography>
        ) : (
          <>
            <KeyboardControls
              domElement={canvasElement ?? undefined}
              map={MOVE_MAP}
            >
              <Canvas
                camera={{
                  fov: STORE_LAYOUT_FOV,
                  position: [...STORE_LAYOUT_VIEWS.iso.position],
                }}
                gl={{ preserveDrawingBuffer: true }}
                onCreated={(state) => {
                  rootStateRef.current = state;
                }}
                style={{ position: "absolute", inset: 0 }}
              >
                <hemisphereLight args={[grey[50], blueGrey[500], 2.2]} />
                <directionalLight intensity={1.1} position={[6, 8, 4]} />
                {STORE_LAYOUT_FLOORS.map((value) => {
                  if (floors !== "all" && floors !== value) return null;

                  const ghost = floors === "all" && !stairs && value !== floor;

                  return (
                    <group
                      key={value}
                      position-y={STORE_LAYOUT_FLOOR_BASE[value]}
                    >
                      {value === "ground" ? (
                        <mesh
                          position={[
                            STORE_LAYOUT_ROOM.width / 2,
                            -STORE_LAYOUT_SLAB_THICKNESS / 2,
                            STORE_LAYOUT_ROOM.depth / 2,
                          ]}
                        >
                          <boxGeometry
                            args={[
                              STORE_LAYOUT_ROOM.width,
                              STORE_LAYOUT_SLAB_THICKNESS,
                              STORE_LAYOUT_ROOM.depth,
                            ]}
                          />
                          <meshStandardMaterial
                            color={grey[300]}
                            {...ghostSurface(ghost)}
                          />
                          <Edges color={grey[700]} {...ghostEdge(ghost)} />
                        </mesh>
                      ) : (
                        <>
                          {STORE_LAYOUT_SLAB_PANELS.map(
                            ({ depth, width, x, z }) => (
                              <mesh
                                key={`${x}-${z}`}
                                position={[
                                  x + width / 2,
                                  -STORE_LAYOUT_SLAB_THICKNESS / 2,
                                  z + depth / 2,
                                ]}
                              >
                                <boxGeometry
                                  args={[
                                    width,
                                    STORE_LAYOUT_SLAB_THICKNESS,
                                    depth,
                                  ]}
                                />
                                <meshStandardMaterial
                                  color={grey[300]}
                                  {...ghostSurface(ghost)}
                                />
                                <Edges
                                  color={grey[700]}
                                  {...ghostEdge(ghost)}
                                />
                              </mesh>
                            ),
                          )}
                          {STORE_LAYOUT_STAIR_GUARDS.map(
                            ({ depth, width, x, z }) => (
                              <mesh
                                key={`guard-${x}-${z}`}
                                position={[
                                  x + width / 2,
                                  STORE_LAYOUT_STAIR_GUARD_HEIGHT / 2,
                                  z + depth / 2,
                                ]}
                              >
                                <boxGeometry
                                  args={[
                                    width,
                                    STORE_LAYOUT_STAIR_GUARD_HEIGHT,
                                    depth,
                                  ]}
                                />
                                <meshStandardMaterial
                                  color={STORE_LAYOUT_KIND_COLORS.stair}
                                  {...ghostSurface(ghost)}
                                />
                                <Edges
                                  color={grey[700]}
                                  {...ghostEdge(ghost)}
                                />
                              </mesh>
                            ),
                          )}
                        </>
                      )}
                      {!ghost && (
                        <>
                          <Line
                            color={grey[500]}
                            lineWidth={1}
                            points={GRID_CELL_POINTS}
                            position-y={0.002}
                            segments
                          />
                          <Line
                            color={grey[700]}
                            lineWidth={2}
                            points={GRID_SECTION_POINTS}
                            position-y={0.003}
                            segments
                          />
                        </>
                      )}
                      {!ghost &&
                        STORE_LAYOUT_WALLS.map(
                          ({ position, rotationY, width }) => (
                            <mesh
                              key={position.join()}
                              position={[...position]}
                              rotation-y={rotationY}
                            >
                              <planeGeometry
                                args={[width, STORE_LAYOUT_ROOM.height]}
                              />
                              <meshStandardMaterial
                                color={grey[200]}
                                opacity={0.55}
                                side={DoubleSide}
                                transparent
                              />
                            </mesh>
                          ),
                        )}
                      {!ghost &&
                        showDimensions &&
                        ROOM_DIMENSIONS.map(
                          ({ from, key, outwards, to, value }) => (
                            <DimensionLine
                              from={from}
                              key={key}
                              labelGap={DIMENSION_LABEL_GAP}
                              outwards={outwards}
                              text={tStoreLayout(`dimensions.${key}`, {
                                value,
                              })}
                              tick={DIMENSION_TICK}
                              to={to}
                            />
                          ),
                        )}
                    </group>
                  );
                })}
                {STORE_LAYOUT_STAIR_STEPS.map(({ depth, top, width, x, z }) => (
                  <mesh
                    key={`${x}-${z}`}
                    position={[x + width / 2, top / 2, z + depth / 2]}
                  >
                    <boxGeometry args={[width, top, depth]} />
                    <meshStandardMaterial
                      color={STORE_LAYOUT_KIND_COLORS.stair}
                    />
                    <Edges color={grey[700]} />
                  </mesh>
                ))}
                {showLabels && (
                  <SpriteLabel
                    position={[
                      STORE_LAYOUT_STAIRWELL.x +
                        STORE_LAYOUT_STAIRWELL.width / 2,
                      STORE_LAYOUT_FLOOR_HEIGHT,
                      STORE_LAYOUT_STAIRWELL.z +
                        STORE_LAYOUT_STAIRWELL.depth / 2,
                    ]}
                    text={tStoreLayout("items.stair")}
                  />
                )}
                {STORE_LAYOUT_ITEMS.map((item) => {
                  if (floors !== "all" && floors !== item.floor) return null;

                  const { depth, elevation, height, kind, label, width, x, z } =
                    item;
                  const ghost =
                    floors === "all" && !stairs && item.floor !== floor;

                  return (
                    <mesh
                      key={`${item.floor}-${label}-${x}-${z}`}
                      position={[
                        x + width / 2,
                        STORE_LAYOUT_FLOOR_BASE[item.floor] +
                          elevation +
                          height / 2,
                        z + depth / 2,
                      ]}
                    >
                      <boxGeometry args={[width, height, depth]} />
                      <meshStandardMaterial
                        color={STORE_LAYOUT_KIND_COLORS[kind]}
                        {...ghostSurface(ghost)}
                      />
                      <Edges color={grey[700]} {...ghostEdge(ghost)} />
                      {showLabels && !ghost && (
                        <SpriteLabel
                          position={[0, height / 2 + 0.08, 0]}
                          text={tStoreLayout(`items.${label}`)}
                        />
                      )}
                      {showDimensions &&
                        !ghost &&
                        itemDimensions(width, height, depth).map(
                          ({ from, key, outwards, to, value }) => (
                            <DimensionLine
                              from={from}
                              key={key}
                              labelGap={ITEM_DIMENSION_LABEL_GAP}
                              outwards={outwards}
                              text={tStoreLayout(`itemDimensions.${key}`, {
                                value: toCentimeters(value),
                              })}
                              tick={ITEM_DIMENSION_TICK}
                              to={to}
                            />
                          ),
                        )}
                    </mesh>
                  );
                })}
                <Avatar
                  character={character}
                  controlsRef={controlsRef}
                  floor={floor}
                  onFloorChange={showFloor}
                  onStairsChange={setStairs}
                  touchRef={touchRef}
                  view={view}
                />
                <OrbitControls
                  maxPolarAngle={
                    view === "first" ? Math.PI / 2 + pitchLimit : Math.PI
                  }
                  minPolarAngle={
                    view === "first" ? Math.PI / 2 - pitchLimit : 0
                  }
                  ref={controlsRef}
                  target={[...STORE_LAYOUT_VIEWS.iso.target]}
                />
              </Canvas>
            </KeyboardControls>
            <Joystick inputRef={touchRef} />
            <GridLegend aria-label={tStoreLayout("gridScale")}>
              <Stack alignItems="center" direction="row" gap={0.5}>
                <GridCellLine />
                <Typography color="text.secondary" variant="caption">
                  {tStoreLayout("gridLegend.cell")}
                </Typography>
              </Stack>
              <Stack alignItems="center" direction="row" gap={0.5}>
                <GridSectionLine />
                <Typography color="text.secondary" variant="caption">
                  {tStoreLayout("gridLegend.section")}
                </Typography>
              </Stack>
            </GridLegend>
            <OverlayActions>
              <OverlayButton
                aria-label={tStoreLayout("export")}
                onClick={handleExport}
                size="small"
              >
                <Download fontSize="small" />
              </OverlayButton>
              <OverlayButton
                aria-label={tStoreLayout(
                  fullscreen ? "exitFullscreen" : "fullscreen",
                )}
                onClick={handleFullscreen}
                size="small"
              >
                {fullscreen ? (
                  <FullscreenExit fontSize="small" />
                ) : (
                  <Fullscreen fontSize="small" />
                )}
              </OverlayButton>
            </OverlayActions>
          </>
        )}
      </StyledPaper>
    </>
  );
};

export default StoreLayout;
