"use client";

import { useTranslations } from "next-intl";
import { type ComponentRef, useRef, useState } from "react";

import {
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_KIND_COLORS,
  STORE_LAYOUT_PEOPLE,
  STORE_LAYOUT_PERSON_COLORS,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_VIEWS,
  STORE_LAYOUT_WALLS,
} from "@/constants/storeLayout";

import {
  Alert,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { blueGrey, grey } from "@mui/material/colors";
import { styled } from "@mui/material/styles";

import { Edges, Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

import { DoubleSide } from "three";

import type { StoreLayoutView } from "@/types/storeLayout";

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

// Html 標籤渲染在獨立的 React root，拿不到 MUI theme context，只能直接引用 CSS 變數
const Label = styled("span")({
  padding: "2px 6px",
  border: "1px solid var(--mui-palette-divider)",
  borderRadius: 4,
  backgroundColor: "var(--mui-palette-background-paper)",
  color: "var(--mui-palette-text-primary)",
  fontSize: 11,
  whiteSpace: "nowrap",
});

const GRID_SIZE = Math.max(STORE_LAYOUT_ROOM.width, STORE_LAYOUT_ROOM.depth);

const StoreLayout = () => {
  const tStoreLayout = useTranslations("storeLayout");

  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  const [showLabels, setShowLabels] = useState(true);
  const [view, setView] = useState<StoreLayoutView>("iso");

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: StoreLayoutView | null,
  ) => {
    const controls = controlsRef.current;
    if (!value || !controls) return;

    const { position, target } = STORE_LAYOUT_VIEWS[value];

    controls.object.position.fromArray(position);
    controls.target.fromArray(target);
    controls.update();
    setView(value);
  };

  const handleShowLabelsChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setShowLabels(checked);
  };

  return (
    <StyledStack gap={2}>
      <Alert severity="info">{tStoreLayout("assumption")}</Alert>
      <Toolbar gap={2}>
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
      </Toolbar>
      <CanvasContainer>
        <Canvas
          camera={{ fov: 55, position: [...STORE_LAYOUT_VIEWS.iso.position] }}
        >
          <hemisphereLight args={[grey[50], blueGrey[500], 2.2]} />
          <directionalLight intensity={1.1} position={[6, 8, 4]} />
          <mesh
            position={[
              STORE_LAYOUT_ROOM.width / 2,
              0,
              STORE_LAYOUT_ROOM.depth / 2,
            ]}
            rotation-x={-Math.PI / 2}
          >
            <planeGeometry
              args={[STORE_LAYOUT_ROOM.width, STORE_LAYOUT_ROOM.depth]}
            />
            <meshStandardMaterial color={grey[300]} />
          </mesh>
          <gridHelper
            args={[GRID_SIZE, GRID_SIZE, grey[500], grey[500]]}
            position={[
              STORE_LAYOUT_ROOM.width / 2,
              0.002,
              STORE_LAYOUT_ROOM.depth / 2,
            ]}
          />
          {STORE_LAYOUT_WALLS.map(({ position, rotationY, width }) => (
            <mesh
              key={position.join()}
              position={[...position]}
              rotation-y={rotationY}
            >
              <planeGeometry args={[width, STORE_LAYOUT_ROOM.height]} />
              <meshStandardMaterial
                color={grey[200]}
                opacity={0.55}
                side={DoubleSide}
                transparent
              />
            </mesh>
          ))}
          {STORE_LAYOUT_ITEMS.map(
            ({ depth, elevation, height, kind, label, width, x, z }) => (
              <mesh
                key={`${label}-${x}-${z}`}
                position={[
                  x + width / 2,
                  elevation + height / 2,
                  z + depth / 2,
                ]}
              >
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={STORE_LAYOUT_KIND_COLORS[kind]} />
                <Edges color={grey[700]} />
                {showLabels && (
                  <Html
                    center
                    pointerEvents="none"
                    position={[0, height / 2 + 0.08, 0]}
                  >
                    <Label>{tStoreLayout(`items.${label}`)}</Label>
                  </Html>
                )}
              </mesh>
            ),
          )}
          {STORE_LAYOUT_PEOPLE.map(({ role, x, z }) => (
            <group key={`${role}-${x}-${z}`} position={[x, 0, z]}>
              <mesh position-y={0.75}>
                <capsuleGeometry args={[0.2, 1.1, 4, 12]} />
                <meshStandardMaterial
                  color={STORE_LAYOUT_PERSON_COLORS[role]}
                />
              </mesh>
              <mesh position-y={1.58}>
                <sphereGeometry args={[0.12]} />
                <meshStandardMaterial
                  color={STORE_LAYOUT_PERSON_COLORS[role]}
                />
              </mesh>
            </group>
          ))}
          <OrbitControls
            ref={controlsRef}
            target={[...STORE_LAYOUT_VIEWS.iso.target]}
          />
        </Canvas>
      </CanvasContainer>
    </StyledStack>
  );
};

export default StoreLayout;
