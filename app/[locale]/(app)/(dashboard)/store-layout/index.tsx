"use client";

import { useTranslations } from "next-intl";
import { type ComponentRef, useRef, useState } from "react";

import {
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_HEIGHT,
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
  STORE_LAYOUT_VIEWS,
  STORE_LAYOUT_VIEW_ORDER,
  STORE_LAYOUT_WALLS,
} from "@/constants/storeLayout";

import { Download } from "@mui/icons-material";
import {
  Button,
  FormControlLabel,
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
  Html,
  KeyboardControls,
  type KeyboardControlsEntry,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, type RootState } from "@react-three/fiber";

import { DoubleSide } from "three";

import type {
  StoreLayoutFloor,
  StoreLayoutMove,
  StoreLayoutView,
} from "@/types/storeLayout";

import Avatar from "./Avatar";

const StyledStack = styled(Stack)({
  flex: 1,
  minHeight: 0,
});

const Toolbar = styled(Stack)({
  alignItems: "center",
  flexDirection: "row",
  flexWrap: "wrap",
});

// md 以下外層沒有鎖 100dvh，畫布要自己給確定高度：只靠 flex 與 minHeight 的話計算值仍是 auto，Canvas 內層的 height: 100% 沒有基準可解析
const CanvasContainer = styled("div")(({ theme }) => ({
  flex: "none",
  height: "70dvh",
  overflow: "hidden",
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,

  [theme.breakpoints.up("md")]: {
    flex: 1,
    height: "auto",
    minHeight: 240,
  },
}));

const EmptyOverlay = styled("div")({
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const Label = styled("span")({
  padding: "2px 6px",
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 4,
  backgroundColor: "var(--mui-palette-background-paper)",
  color: "var(--mui-palette-text-primary)",
  fontSize: 11,
  whiteSpace: "nowrap",
});

const Size = styled("span")({
  marginLeft: 4,
  color: "var(--mui-palette-text-secondary)",
});

const Dimension = styled("span")({
  color: "var(--mui-palette-text-secondary)",
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: "nowrap",
  textShadow:
    "0 0 3px var(--mui-palette-background-default), 0 0 3px var(--mui-palette-background-default)",
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

// 每個 prop 都要一直在；改成 ghost 時才展開的話，R3F 會把消失的 opacity 設成 0 而不是 1，實心那層整層看不見
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

  const [canvasElement, setCanvasElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [floor, setFloor] = useState<StoreLayoutFloor>("ground");
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

  const handleFloorChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: StoreLayoutFloor | null,
  ) => {
    if (!value) return;

    setFloor(value);
    applyView(view, value);
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

  const handleExport = () => {
    const state = rootStateRef.current;
    if (!state) return;

    state.gl.render(state.scene, state.camera);

    const link = document.createElement("a");

    link.href = state.gl.domElement.toDataURL("image/png");
    link.download = `store-layout-${floor}-${view}.png`;
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

  if (empty)
    return (
      <StyledStack gap={2}>
        <CanvasContainer>
          <EmptyOverlay>
            <Typography color="text.secondary" variant="body2">
              {tStoreLayout("empty")}
            </Typography>
          </EmptyOverlay>
        </CanvasContainer>
      </StyledStack>
    );

  return (
    <StyledStack gap={2}>
      <Toolbar gap={2}>
        <ToggleButtonGroup
          exclusive
          onChange={handleFloorChange}
          size="small"
          value={floor}
        >
          {STORE_LAYOUT_FLOORS.map((value) => (
            <ToggleButton key={value} value={value}>
              {tStoreLayout(`floors.${value}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
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
        </ToggleButtonGroup>
        <FormControlLabel
          control={
            <Switch checked={showLabels} onChange={handleShowLabelsChange} />
          }
          label={tStoreLayout("showLabels")}
        />
        <Button onClick={handleExport} size="small" startIcon={<Download />}>
          {tStoreLayout("export")}
        </Button>
        <Typography color="text.secondary" variant="caption">
          {tStoreLayout("gridScale")}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {tStoreLayout("moveHint")}
        </Typography>
      </Toolbar>
      <CanvasContainer
        onKeyDown={handleKeyDown}
        ref={setCanvasElement}
        tabIndex={0}
      >
        <KeyboardControls
          domElement={canvasElement ?? undefined}
          map={MOVE_MAP}
        >
          <Canvas
            camera={{ fov: 55, position: [...STORE_LAYOUT_VIEWS.iso.position] }}
            // 合成後繪圖緩衝區的內容即失效，不保留的話 toDataURL 會匯出空白圖
            gl={{ preserveDrawingBuffer: true }}
            onCreated={(state) => {
              rootStateRef.current = state;
            }}
          >
            <hemisphereLight args={[grey[50], blueGrey[500], 2.2]} />
            <directionalLight intensity={1.1} position={[6, 8, 4]} />
            {STORE_LAYOUT_FLOORS.map((value) => {
              const ghost = value !== floor;

              return (
                <group key={value} position-y={STORE_LAYOUT_FLOOR_BASE[value]}>
                  {value === "ground" ? (
                    <mesh
                      position={[
                        STORE_LAYOUT_ROOM.width / 2,
                        0,
                        STORE_LAYOUT_ROOM.depth / 2,
                      ]}
                      rotation-x={-Math.PI / 2}
                    >
                      <planeGeometry
                        args={[
                          STORE_LAYOUT_ROOM.width,
                          STORE_LAYOUT_ROOM.depth,
                        ]}
                      />
                      <meshStandardMaterial
                        color={grey[300]}
                        {...ghostSurface(ghost)}
                      />
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
                              args={[width, STORE_LAYOUT_SLAB_THICKNESS, depth]}
                            />
                            <meshStandardMaterial
                              color={grey[300]}
                              {...ghostSurface(ghost)}
                            />
                            <Edges color={grey[700]} {...ghostEdge(ghost)} />
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
                            <Edges color={grey[700]} {...ghostEdge(ghost)} />
                          </mesh>
                        ),
                      )}
                    </>
                  )}
                  {!ghost && (
                    <Grid
                      args={[STORE_LAYOUT_ROOM.width, STORE_LAYOUT_ROOM.depth]}
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
                    STORE_LAYOUT_WALLS.map(({ position, rotationY, width }) => (
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
                    ))}
                </group>
              );
            })}
            {STORE_LAYOUT_STAIR_STEPS.map(({ depth, top, width, x, z }) => (
              <mesh
                key={`${x}-${z}`}
                position={[x + width / 2, top / 2, z + depth / 2]}
              >
                <boxGeometry args={[width, top, depth]} />
                <meshStandardMaterial color={STORE_LAYOUT_KIND_COLORS.stair} />
                <Edges color={grey[700]} />
              </mesh>
            ))}
            {showLabels && (
              <Html
                center
                pointerEvents="none"
                position={[
                  STORE_LAYOUT_STAIRWELL.x + STORE_LAYOUT_STAIRWELL.width / 2,
                  STORE_LAYOUT_FLOOR_HEIGHT,
                  STORE_LAYOUT_STAIRWELL.z + STORE_LAYOUT_STAIRWELL.depth / 2,
                ]}
              >
                <Label>{tStoreLayout("items.stair")}</Label>
              </Html>
            )}
            {ROOM_DIMENSIONS.map(({ key, position, value }) => (
              <Html
                center
                key={key}
                pointerEvents="none"
                position={[...position]}
              >
                <Dimension>
                  {tStoreLayout(`dimensions.${key}`, { value })}
                </Dimension>
              </Html>
            ))}
            {STORE_LAYOUT_ITEMS.map((item) => {
              const { depth, elevation, height, kind, label, width, x, z } =
                item;
              const ghost = item.floor !== floor;

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
                    <Html
                      center
                      pointerEvents="none"
                      position={[0, height / 2 + 0.08, 0]}
                    >
                      <Label>
                        {tStoreLayout(`items.${label}`)}
                        <Size>
                          {tStoreLayout("itemSize", {
                            depth: toCentimeters(depth),
                            height: toCentimeters(height),
                            width: toCentimeters(width),
                          })}
                        </Size>
                      </Label>
                    </Html>
                  )}
                </mesh>
              );
            })}
            <Avatar
              controlsRef={controlsRef}
              floor={floor}
              onFloorChange={setFloor}
              view={view}
            />
            <OrbitControls
              maxPolarAngle={
                view === "first" ? Math.PI / 2 + pitchLimit : Math.PI
              }
              minPolarAngle={view === "first" ? Math.PI / 2 - pitchLimit : 0}
              ref={controlsRef}
              target={[...STORE_LAYOUT_VIEWS.iso.target]}
            />
          </Canvas>
        </KeyboardControls>
      </CanvasContainer>
    </StyledStack>
  );
};

export default StoreLayout;
