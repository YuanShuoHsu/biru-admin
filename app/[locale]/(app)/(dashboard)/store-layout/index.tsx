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
  Grid,
  KeyboardControls,
  type KeyboardControlsEntry,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, type RootState } from "@react-three/fiber";

import type {
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

const StyledPaper = styled(Paper)({
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
});

const OverlayButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.vars.palette.divider}`,
  color: theme.vars.palette.text.primary,
}));

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

const ROOM_DIMENSIONS = [
  {
    key: "width",
    position: [
      STORE_LAYOUT_ROOM.width / 2,
      0,
      STORE_LAYOUT_ROOM.depth + 0.45,
    ] as const,
    value: STORE_LAYOUT_ROOM.width,
  },
  {
    key: "depth",
    position: [
      STORE_LAYOUT_ROOM.width + 0.45,
      0,
      STORE_LAYOUT_ROOM.depth / 2,
    ] as const,
    value: STORE_LAYOUT_ROOM.depth,
  },
  {
    key: "height",
    position: [-0.35, STORE_LAYOUT_ROOM.height / 2, -0.35] as const,
    value: STORE_LAYOUT_ROOM.height,
  },
] as const;

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
  const fullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => Boolean(document.fullscreenElement),
    () => false,
  );
  const fullscreenSupported = useSyncExternalStore(
    subscribeNothing,
    () => document.fullscreenEnabled,
    () => false,
  );

  const [floor, setFloor] = useState<StoreLayoutFloor>("ground");
  const [floors, setFloors] = useState<StoreLayoutFloorFilter>("ground");
  const [stairs, setStairs] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key.startsWith("Arrow") || event.code === "Space")
      event.preventDefault();
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void canvasElement?.requestFullscreen();
  };

  const handleExport = () => {
    const state = rootStateRef.current;
    if (!state) return;

    state.gl.render(state.scene, state.camera);

    const link = document.createElement("a");

    link.href = state.gl.domElement.toDataURL("image/png");
    link.download = `store-layout-${floors}-${view}.png`;
    document.body.append(link);
    link.click();
    link.remove();
  };

  const handleShowLabelsChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setShowLabels(checked);
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
          <FormControlLabel
            control={
              <Switch checked={showLabels} onChange={handleShowLabelsChange} />
            }
            label={tStoreLayout("showLabels")}
          />
          <Typography color="text.secondary" variant="caption">
            {tStoreLayout("gridScale")}
          </Typography>
          <KeyboardHint color="text.secondary" variant="caption">
            {tStoreLayout("moveHint")}
          </KeyboardHint>
        </Stack>
      )}
      <StyledPaper
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
                        <Grid
                          args={[
                            STORE_LAYOUT_ROOM.width,
                            STORE_LAYOUT_ROOM.depth,
                          ]}
                          cellColor={grey[500]}
                          cellSize={1}
                          fadeStrength={0}
                          position={[
                            STORE_LAYOUT_ROOM.width / 2,
                            0.002,
                            STORE_LAYOUT_ROOM.depth / 2,
                          ]}
                          sectionColor={grey[700]}
                          sectionSize={5}
                          side={DoubleSide}
                        />
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
                {ROOM_DIMENSIONS.map(({ key, position, value }) => (
                  <SpriteLabel
                    key={key}
                    plain
                    position={[...position]}
                    text={tStoreLayout(`dimensions.${key}`, { value })}
                  />
                ))}
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
                          note={tStoreLayout("itemSize", {
                            depth: toCentimeters(depth),
                            height: toCentimeters(height),
                            width: toCentimeters(width),
                          })}
                          position={[0, height / 2 + 0.08, 0]}
                          text={tStoreLayout(`items.${label}`)}
                        />
                      )}
                    </mesh>
                  );
                })}
                <Avatar
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
            <Stack
              position="absolute"
              bottom={12}
              right={12}
              flexDirection="row"
              gap={1}
            >
              <OverlayButton
                aria-label={tStoreLayout("export")}
                onClick={handleExport}
                size="small"
              >
                <Download fontSize="small" />
              </OverlayButton>
              {fullscreenSupported && (
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
              )}
            </Stack>
          </>
        )}
      </StyledPaper>
    </>
  );
};

export default StoreLayout;
