"use client";

import { useTranslations } from "next-intl";
import { type ComponentRef, useMemo, useRef, useState } from "react";

import {
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_HEIGHT,
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_KIND_COLORS,
  STORE_LAYOUT_PEOPLE,
  STORE_LAYOUT_PERSON_COLORS,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SLAB_PANELS,
  STORE_LAYOUT_SLAB_THICKNESS,
  STORE_LAYOUT_STAIRWELL,
  STORE_LAYOUT_STAIR_STEPS,
  STORE_LAYOUT_VIEWS,
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
  StoreLayoutItem,
  StoreLayoutMove,
  StoreLayoutView,
} from "@/types/storeLayout";

import Avatar from "./Avatar";
import Person from "./Person";

const StyledStack = styled(Stack)({
  flex: 1,
  minHeight: 0,
});

const Toolbar = styled(Stack)({
  alignItems: "center",
  flexDirection: "row",
  flexWrap: "wrap",
});

const CanvasContainer = styled("div")(({ theme }) => ({
  flex: 1,
  minHeight: 480,
  overflow: "hidden",
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,

  [theme.breakpoints.up("md")]: {
    minHeight: 0,
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
];

const REPEATED_AT_LEAST = 3;

const GHOST_SURFACE = { depthWrite: false, opacity: 0.06, transparent: true };
const GHOST_EDGE = { depthWrite: false, opacity: 0.4, transparent: true };

const sizeKey = ({ depth, height, label, width }: StoreLayoutItem) =>
  `${label}|${width}x${depth}x${height}`;

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

  const floorItems = useMemo(
    () => STORE_LAYOUT_ITEMS.filter((item) => item.floor === floor),
    [floor],
  );

  const repeatedGroups = useMemo(() => {
    const groups = new Map<string, StoreLayoutItem & { count: number }>();

    for (const item of floorItems) {
      const key = sizeKey(item);
      const group = groups.get(key);

      if (group) group.count += 1;
      else groups.set(key, { ...item, count: 1 });
    }

    return [...groups.values()].filter(
      ({ count }) => count >= REPEATED_AT_LEAST,
    );
  }, [floorItems]);

  const repeatedKeys = useMemo(
    () => new Set(repeatedGroups.map(sizeKey)),
    [repeatedGroups],
  );

  const people = useMemo(
    () => STORE_LAYOUT_PEOPLE.filter((person) => person.floor === floor),
    [floor],
  );

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
          {(Object.keys(STORE_LAYOUT_VIEWS) as StoreLayoutView[]).map(
            (value) => (
              <ToggleButton key={value} value={value}>
                {tStoreLayout(`views.${value}`)}
              </ToggleButton>
            ),
          )}
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
        {repeatedGroups.map((group) => (
          <Typography
            color="text.secondary"
            key={sizeKey(group)}
            variant="caption"
          >
            {tStoreLayout("repeatedSize", {
              count: group.count,
              label: tStoreLayout(`items.${group.label}`),
              size: tStoreLayout("itemSize", {
                depth: toCentimeters(group.depth),
                height: toCentimeters(group.height),
                width: toCentimeters(group.width),
              }),
            })}
          </Typography>
        ))}
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
                        {...(ghost && GHOST_SURFACE)}
                      />
                    </mesh>
                  ) : (
                    STORE_LAYOUT_SLAB_PANELS.map(({ depth, width, x, z }) => (
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
                          {...(ghost && GHOST_SURFACE)}
                        />
                        <Edges color={grey[700]} {...(ghost && GHOST_EDGE)} />
                      </mesh>
                    ))
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
                    {...(ghost && GHOST_SURFACE)}
                  />
                  <Edges color={grey[700]} {...(ghost && GHOST_EDGE)} />
                  {showLabels && !ghost && (
                    <Html
                      center
                      pointerEvents="none"
                      position={[0, height / 2 + 0.08, 0]}
                    >
                      <Label>
                        {tStoreLayout(`items.${label}`)}
                        {!repeatedKeys.has(sizeKey(item)) && (
                          <Size>
                            {tStoreLayout("itemSize", {
                              depth: toCentimeters(depth),
                              height: toCentimeters(height),
                              width: toCentimeters(width),
                            })}
                          </Size>
                        )}
                      </Label>
                    </Html>
                  )}
                </mesh>
              );
            })}
            {people.map(({ floor: personFloor, role, x, z }) => (
              <group
                key={`${personFloor}-${role}-${x}-${z}`}
                position={[x, STORE_LAYOUT_FLOOR_BASE[personFloor], z]}
              >
                <Person color={STORE_LAYOUT_PERSON_COLORS[role]} />
              </group>
            ))}
            <Avatar
              controlsRef={controlsRef}
              floor={floor}
              onFloorChange={setFloor}
              view={view}
            />
            <OrbitControls
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
