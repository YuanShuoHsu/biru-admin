"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import {
  type ComponentRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import useSWR from "swr";
import { DoubleSide } from "three";

import { STATUS_COLORS, STATUS_TEXT_COLORS } from "@/constants/orders";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import Avatar from "./Avatar";
import { createAvatarState } from "./Avatar/movement";
import DineInTables from "./DineInTables";
import DriveThru from "./DriveThru";
import Elevator from "./Elevator";
import { createElevatorState } from "./Elevator/motion";
import Furniture from "./Realistic/Furniture";
import ItemBody from "./Realistic/ItemBody";
import Lighting from "./Realistic/Lighting";
import Shell from "./Realistic/Shell";
import Surface, { SURFACES } from "./Realistic/Surface";
import Restrooms from "./Restrooms";
import { createDoorsState } from "./Restrooms/motion";
import SpriteLabel from "./SpriteLabel";
import { ghostEdge, ghostSurface } from "./ghost";

import {
  STORE_LAYOUT_CHARACTER_ORDER,
  STORE_LAYOUT_ELEVATOR,
  STORE_LAYOUT_FLOORS,
  STORE_LAYOUT_FLOOR_BASE,
  STORE_LAYOUT_FLOOR_FILTERS,
  STORE_LAYOUT_FLOOR_HEIGHT,
  STORE_LAYOUT_FOV,
  STORE_LAYOUT_ITEMS,
  STORE_LAYOUT_JOYSTICK,
  STORE_LAYOUT_KIND_COLORS,
  STORE_LAYOUT_LOOK,
  STORE_LAYOUT_ROOM,
  STORE_LAYOUT_SEATS,
  STORE_LAYOUT_SLAB_PANELS,
  STORE_LAYOUT_SLAB_THICKNESS,
  STORE_LAYOUT_STAIRWELL,
  STORE_LAYOUT_STAIR_GUARDS,
  STORE_LAYOUT_STAIR_GUARD_HEIGHT,
  STORE_LAYOUT_STAIR_STEPS,
  STORE_LAYOUT_TABLES,
  STORE_LAYOUT_TOUCH_MEDIA,
  STORE_LAYOUT_TOUCH_QUERY,
  STORE_LAYOUT_VIEWS,
  STORE_LAYOUT_VIEW_ORDER,
  STORE_LAYOUT_WALLS,
  STORE_LAYOUT_ZOOM_DISTANCE,
} from "@/constants/storeLayout";

import {
  Download,
  Fullscreen,
  FullscreenExit,
  ReceiptLong,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
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
import { styled, useTheme } from "@mui/material/styles";

import {
  Edges,
  KeyboardControls,
  type KeyboardControlsEntry,
  Line,
  OrbitControls,
} from "@react-three/drei";
import { Canvas, type RootState } from "@react-three/fiber";

import OrderDetailDialog from "../orders/OrderDetailDialog";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { orderBoardStatusValues } from "@/types/api";
import type {
  AdminOrderBoardColumn,
  AdminOrderResponse,
  OrderBoardStatus,
} from "@/types/orders";
import type { Organization } from "@/types/organizations";
import type {
  StoreLayoutCharacter,
  StoreLayoutFloor,
  StoreLayoutFloorFilter,
  StoreLayoutItem,
  StoreLayoutMove,
  StoreLayoutTouchInput,
  StoreLayoutView,
} from "@/types/storeLayout";

import { getErrorMessage } from "@/utils/errors";

const Joystick = dynamic(() => import("./Joystick"), { ssr: false });

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const DisplaySwitches = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const FloorControls = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1, 2),
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  transition: theme.transitions.create("background-color"),
}));

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== "fullscreen",
})<{ fullscreen: boolean }>(({ fullscreen, theme }) => ({
  position: "relative",
  flex: 1,
  minHeight: 300,
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

const BottomBar = styled(Box)(({ theme }) => ({
  position: "absolute",
  insetInline: theme.spacing(1.5),
  bottom: theme.spacing(1.5),
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "end",
  columnGap: theme.spacing(1),
  pointerEvents: "none",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    gridTemplateRows: `auto calc(${
      STORE_LAYOUT_JOYSTICK.inset +
      STORE_LAYOUT_JOYSTICK.radius +
      STORE_LAYOUT_JOYSTICK.edgeGap
    }px - ${theme.spacing(1.5)})`,
  },
}));

const OverlayActions = styled(Stack)(({ theme }) => ({
  gridRow: 2,
  gridColumn: 3,
  justifySelf: "end",
  flexDirection: "row",
  gap: theme.spacing(1),
  pointerEvents: "auto",
}));

const TablePrompt = styled(Button)(({ theme }) => ({
  gridRow: 2,
  gridColumn: 2,
  flexWrap: "wrap",
  gap: theme.spacing(1),
  pointerEvents: "auto",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    gridRow: 1,
    gridColumn: "1 / -1",
    justifySelf: "center",
  },
}));

const OverlayButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.vars.palette.divider}`,
  color: theme.vars.palette.text.primary,
}));

const GridLegend = styled(Stack)(({ theme }) => ({
  gridRow: 2,
  gridColumn: 1,
  justifySelf: "start",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(0.25, 1),
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create("border-color"),
}));

const SummaryPaper = styled(Paper)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1.5),
  left: theme.spacing(1.5),
  maxWidth: `calc(100% - ${theme.spacing(3)})`,
  padding: theme.spacing(0.5, 1),
  pointerEvents: "none",
}));

const StatusLegend = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  columnGap: theme.spacing(1.5),
}));

const StatusDot = styled("span")(({ theme }) => ({
  display: "inline-block",
  width: 8,
  height: 8,
  marginInlineEnd: theme.spacing(0.5),
  borderRadius: "50%",
}));

const LegendStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(0.5),
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
  { keys: ["ShiftLeft", "ShiftRight"], name: "sprint" },
  { keys: ["KeyI"], name: "lookUp" },
  { keys: ["KeyK"], name: "lookDown" },
  { keys: ["KeyJ"], name: "lookLeft" },
  { keys: ["KeyL"], name: "lookRight" },
  { keys: ["KeyO"], name: "zoomIn" },
  { keys: ["KeyU"], name: "zoomOut" },
];

const FLOORS_BY_KEY = new Map(
  STORE_LAYOUT_FLOOR_FILTERS.map((value, index) => [
    `Digit${index + 1}`,
    value,
  ]),
);

const nextInOrder = <Value,>(order: readonly Value[], current: Value) =>
  order[(order.indexOf(current) + 1) % order.length];

const { pitchLimit } = STORE_LAYOUT_LOOK;

const subscribeFullscreen = (onChange: () => void) => {
  document.addEventListener("fullscreenchange", onChange);

  return () => document.removeEventListener("fullscreenchange", onChange);
};

const subscribeNothing = () => () => {};

const savesToPhotoLibrary = (file: File) =>
  window.matchMedia(STORE_LAYOUT_TOUCH_QUERY).matches &&
  Boolean(navigator.canShare?.({ files: [file] }));

const FLOOR_SUMMARIES = STORE_LAYOUT_FLOORS.map((floor) => ({
  floor,
  seats: STORE_LAYOUT_SEATS.filter(
    (seat) => seat.floor === floor && !seat.elevation,
  ).length,
  tables: STORE_LAYOUT_TABLES.filter((table) => table.floor === floor),
}));

const DRIVE_THRU_OUTDOOR_LABELS = new Set<StoreLayoutItem["label"]>([
  "driveThruMenuBoard",
  "driveThruSpeaker",
]);

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

interface ItemAnnotationsProps {
  depth: number;
  height: number;
  label: string | null;
  showDimensions: boolean;
  width: number;
}

const ItemAnnotations = ({
  depth,
  height,
  label,
  showDimensions,
  width,
}: ItemAnnotationsProps) => {
  const tStoreLayout = useTranslations("storeLayout");

  return (
    <>
      {label && (
        <SpriteLabel position={[0, height / 2 + 0.08, 0]} text={label} />
      )}
      {showDimensions &&
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
    </>
  );
};

interface StoreLayoutProps {
  columns: AdminOrderBoardColumn[];
  empty?: boolean;
  organization: Organization;
}

const StoreLayout = ({
  columns: initialColumns,
  empty,
  organization: { id: organizationId, slug: organizationSlug },
}: StoreLayoutProps) => {
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");
  const tStoreLayout = useTranslations("storeLayout");

  const { setDialog } = useDialogStore((state) => state);

  const theme = useTheme();

  const { data: boardColumns = initialColumns, mutate } = useSWR<
    AdminOrderBoardColumn[]
  >(
    empty ? null : `/api/organizations/${organizationSlug}/orders/board/admin`,
    { fallbackData: initialColumns },
  );

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (empty || !isConnected) return;

    menuSocket
      .timeout(5000)
      .emitWithAck("joinOrdersBoard", { organizationId })
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );

    menuSocket.on("orderUpdated", mutate);

    return () => {
      menuSocket.off("orderUpdated", mutate);
    };
  }, [empty, isConnected, mutate, organizationId]);

  const tableOrders = useMemo(() => {
    const byTable = new Map<number, AdminOrderResponse[]>();

    for (const order of boardColumns.flatMap(({ orders }) => orders)) {
      if (order.mode !== "dineIn" || !order.tableNumber) continue;
      if (
        !orderBoardStatusValues.some((status) => status === order.orderStatus)
      )
        continue;

      byTable.set(order.tableNumber, [
        ...(byTable.get(order.tableNumber) ?? []),
        order,
      ]);
    }

    return byTable;
  }, [boardColumns]);

  // 場景固定是亮色打光，跟著暗色模式換淺色色票會在木地板上看不出來
  const statusColor = (status: OrderBoardStatus) => {
    const palette = theme.colorSchemes.light?.palette ?? theme.palette;
    const key = STATUS_TEXT_COLORS[status];

    return key === "text" ? palette.text.primary : palette[key].main;
  };

  const tableStatuses = new Map(
    [...tableOrders].flatMap(([tableNumber, orders]) => {
      const status = orderBoardStatusValues.find((value) =>
        orders.some(({ orderStatus }) => orderStatus === value),
      );

      return status ? [[tableNumber, status] as const] : [];
    }),
  );

  const tableColors = new Map(
    [...tableStatuses].map(([tableNumber, status]) => [
      tableNumber,
      statusColor(status),
    ]),
  );

  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const rootStateRef = useRef<RootState>(null);
  const elevatorRef = useRef(createElevatorState());
  const doorsRef = useRef(createDoorsState());
  const avatarRef = useRef(createAvatarState());
  const touchRef = useRef<StoreLayoutTouchInput>({
    jump: false,
    lookSideways: 0,
    lookVertical: 0,
    sideways: 0,
    towards: 0,
    zoom: 0,
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

  useEffect(() => {
    if (!emulatedFullscreen) return;

    const { scrollX, scrollY } = window;
    const root = document.documentElement;
    const scrollToTop = () => window.scrollTo(0, 0);

    root.style.overflow = "hidden";
    scrollToTop();

    window.addEventListener("scroll", scrollToTop);

    return () => {
      window.removeEventListener("scroll", scrollToTop);
      root.style.overflow = "";
      window.scrollTo(scrollX, scrollY);
    };
  }, [emulatedFullscreen]);

  const [character, setCharacter] = useState<StoreLayoutCharacter>("male");
  const [floor, setFloor] = useState<StoreLayoutFloor>("ground");
  const [floors, setFloors] = useState<StoreLayoutFloorFilter>("ground");
  const [focusFloor, setFocusFloor] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [realistic, setRealistic] = useState(true);
  const [view, setView] = useState<StoreLayoutView>("iso");
  const [nearbyTable, setNearbyTable] = useState<number | null>(null);

  const nearbyStatus = nearbyTable ? tableStatuses.get(nearbyTable) : undefined;

  const isGhostFloor = (value: StoreLayoutFloor) =>
    floors === "all" && focusFloor && value !== floor;

  const isGhostItem = (item: StoreLayoutItem) =>
    isGhostFloor(item.floor) ||
    (focusFloor && DRIVE_THRU_OUTDOOR_LABELS.has(item.label));

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

  const selectFloors = (value: StoreLayoutFloorFilter) => {
    setFloors(value);

    if (value === "all") return;

    setFloor(value);
    applyView(view, value);
  };

  const handleFloorsChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: StoreLayoutFloorFilter | null,
  ) => {
    if (value) selectFloors(value);
  };

  const showFloor = (value: StoreLayoutFloor) => {
    setFloor(value);
    setFloors((current) => (current === "all" ? current : value));
  };

  const selectView = (value: StoreLayoutView) => {
    applyView(value, floor);
    setView(value);
  };

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: StoreLayoutView | null,
  ) => {
    if (value) selectView(value);
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

    if (event.repeat || event.metaKey || event.ctrlKey) return;

    const nextFloors = FLOORS_BY_KEY.get(event.code);

    if (nextFloors) selectFloors(nextFloors);

    if (event.code === "KeyV")
      selectView(nextInOrder(STORE_LAYOUT_VIEW_ORDER, view));

    if (event.code === "KeyC")
      setCharacter(nextInOrder(STORE_LAYOUT_CHARACTER_ORDER, character));

    if (event.code === "KeyF" && floors !== "upper") setFocusFloor((on) => !on);

    if (event.code === "KeyR") setRealistic((on) => !on);

    if (event.code === "KeyN") setShowLabels((on) => !on);

    if (event.code === "KeyM") setShowDimensions((on) => !on);

    if (
      event.key === "Enter" &&
      event.target === event.currentTarget &&
      nearbyTable
    )
      handleTableSelect(nearbyTable);
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

    // 寫實模式由後製合成輸出，再直接 render 一次會蓋掉環境光遮蔽與泛光
    if (!realistic) state.gl.render(state.scene, state.camera);

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

  const handleTableSelect = (tableNumber: number) => {
    setDialog({
      container: document.fullscreenElement,
      content: (
        <Stack divider={<Divider />} spacing={2}>
          {tableOrders.get(tableNumber)?.map((order) => (
            <OrderDetailDialog
              key={order.id}
              order={order}
              organizationSlug={organizationSlug}
            />
          ))}
        </Stack>
      ),
      open: true,
      title: tOrder("mode.dineIn.tableNumber.value", { tableNumber }),
    });
  };

  const tableLabel = (item: (typeof STORE_LAYOUT_TABLES)[number]) => {
    const tableNumber = tOrder("mode.dineIn.tableNumber.value", {
      tableNumber: item.tableNumber,
    });

    return item.label === "table"
      ? tableNumber
      : [tStoreLayout(`items.${item.label}`), tableNumber].join(
          tCommon("delimiter"),
        );
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

  const handleFocusFloorChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setFocusFloor(checked);
  };

  const handleRealisticChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) => {
    setRealistic(checked);
  };

  const handleControlsMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
    canvasElement?.focus({ preventScroll: true });
  };

  return (
    <>
      {!empty && (
        <ToolbarStack direction="row" onMouseDown={handleControlsMouseDown}>
          <FloorControls direction="row">
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
            {floors !== "upper" && (
              <FormControlLabel
                control={
                  <Switch
                    checked={focusFloor}
                    onChange={handleFocusFloorChange}
                  />
                }
                label={tStoreLayout("focusFloor")}
              />
            )}
          </FloorControls>
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
          <DisplaySwitches direction="row">
            <FormControlLabel
              control={
                <Switch checked={realistic} onChange={handleRealisticChange} />
              }
              label={tStoreLayout("realistic")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showLabels}
                  onChange={handleShowLabelsChange}
                />
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
          </DisplaySwitches>
          <KeyboardHint color="textSecondary" variant="caption">
            {tStoreLayout("moveHint", { view })}
          </KeyboardHint>
        </ToolbarStack>
      )}
      <StyledPaper
        fullscreen={emulatedFullscreen}
        ref={setCanvasElement}
        variant="outlined"
        {...(!empty && { onKeyDown: handleKeyDown, tabIndex: 0 })}
      >
        {empty ? (
          <Typography color="textSecondary" variant="body2">
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
                shadows="percentage"
                onCreated={(state) => {
                  rootStateRef.current = state;
                }}
                style={{ position: "absolute", inset: 0 }}
              >
                {realistic ? (
                  <Lighting />
                ) : (
                  <>
                    <hemisphereLight args={[grey[50], blueGrey[500], 2.2]} />
                    <directionalLight intensity={1.1} position={[6, 8, 4]} />
                  </>
                )}
                {STORE_LAYOUT_FLOORS.map((value) => {
                  if (floors !== "all" && floors !== value) return null;

                  const ghost = isGhostFloor(value);

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
                          {!realistic && (
                            <Edges color={grey[700]} {...ghostEdge(ghost)} />
                          )}
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
                                {!realistic && (
                                  <Edges
                                    color={grey[700]}
                                    {...ghostEdge(ghost)}
                                  />
                                )}
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
                                {realistic ? (
                                  <Surface
                                    ghost={ghost}
                                    spec={SURFACES.glass}
                                  />
                                ) : (
                                  <meshStandardMaterial
                                    color={STORE_LAYOUT_KIND_COLORS.stair}
                                    {...ghostSurface(ghost)}
                                  />
                                )}
                                {!realistic && (
                                  <Edges
                                    color={grey[700]}
                                    {...ghostEdge(ghost)}
                                  />
                                )}
                              </mesh>
                            ),
                          )}
                        </>
                      )}
                      {!ghost && !realistic && (
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
                      {realistic && <Shell floor={value} ghost={ghost} />}
                      {!ghost &&
                        !realistic &&
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
                    castShadow={realistic}
                    key={`${x}-${z}`}
                    position={[x + width / 2, top / 2, z + depth / 2]}
                    receiveShadow
                  >
                    <boxGeometry args={[width, top, depth]} />
                    {realistic ? (
                      <Surface spec={SURFACES.walnut} />
                    ) : (
                      <meshStandardMaterial
                        color={STORE_LAYOUT_KIND_COLORS.stair}
                      />
                    )}
                    {!realistic && <Edges color={grey[700]} />}
                  </mesh>
                ))}
                <group
                  position={[
                    STORE_LAYOUT_STAIRWELL.x + STORE_LAYOUT_STAIRWELL.width / 2,
                    STORE_LAYOUT_FLOOR_HEIGHT / 2,
                    STORE_LAYOUT_STAIRWELL.z + STORE_LAYOUT_STAIRWELL.depth / 2,
                  ]}
                >
                  <ItemAnnotations
                    depth={STORE_LAYOUT_STAIRWELL.depth}
                    height={STORE_LAYOUT_FLOOR_HEIGHT}
                    label={showLabels ? tStoreLayout("items.stair") : null}
                    showDimensions={showDimensions}
                    width={STORE_LAYOUT_STAIRWELL.width}
                  />
                </group>
                {STORE_LAYOUT_ITEMS.map((item) => {
                  if (floors !== "all" && floors !== item.floor) return null;

                  const { depth, elevation, height, kind, label, width, x, z } =
                    item;
                  const ghost = isGhostItem(item);

                  return (
                    <group
                      key={`${item.floor}-${label}-${x}-${z}`}
                      position={[
                        x + width / 2,
                        STORE_LAYOUT_FLOOR_BASE[item.floor] +
                          elevation +
                          height / 2,
                        z + depth / 2,
                      ]}
                    >
                      {label === "entrance" ||
                      label === "driveThruWindow" ? null : realistic ? (
                        <ItemBody ghost={ghost} item={item} />
                      ) : (
                        <mesh>
                          <boxGeometry args={[width, height, depth]} />
                          <meshStandardMaterial
                            color={STORE_LAYOUT_KIND_COLORS[kind]}
                            {...ghostSurface(ghost)}
                          />
                          <Edges color={grey[700]} {...ghostEdge(ghost)} />
                        </mesh>
                      )}
                      {!ghost && (
                        <ItemAnnotations
                          depth={depth}
                          height={height}
                          label={
                            !showLabels
                              ? null
                              : "tableNumber" in item
                                ? tableLabel(item)
                                : tStoreLayout(`items.${label}`)
                          }
                          showDimensions={showDimensions}
                          width={width}
                        />
                      )}
                    </group>
                  );
                })}
                {floors !== "upper" && (
                  <DriveThru
                    ghost={focusFloor}
                    realistic={realistic}
                    showLabels={showLabels}
                  />
                )}
                <Restrooms
                  doorsRef={doorsRef}
                  floors={floors}
                  isGhostFloor={isGhostFloor}
                  realistic={realistic}
                  showLabels={showLabels}
                />
                <DineInTables
                  avatarRef={avatarRef}
                  floor={floor}
                  floors={floors}
                  isGhostFloor={isGhostFloor}
                  onNearbyTableChange={setNearbyTable}
                  tableColors={tableColors}
                />
                {realistic && (
                  <Furniture floors={floors} isGhostFloor={isGhostFloor} />
                )}
                {!realistic &&
                  STORE_LAYOUT_SEATS.map((seat) => {
                    if (floors !== "all" && floors !== seat.floor) return null;

                    const { depth, elevation, height, width, x, z } = seat;
                    const ghost = isGhostFloor(seat.floor);

                    return (
                      <mesh
                        key={`${seat.floor}-${x}-${z}-${elevation}`}
                        position={[
                          x + width / 2,
                          STORE_LAYOUT_FLOOR_BASE[seat.floor] +
                            elevation +
                            height / 2,
                          z + depth / 2,
                        ]}
                      >
                        <boxGeometry args={[width, height, depth]} />
                        <meshStandardMaterial
                          color={STORE_LAYOUT_KIND_COLORS.seat}
                          {...ghostSurface(ghost)}
                        />
                        <Edges color={grey[700]} {...ghostEdge(ghost)} />
                      </mesh>
                    );
                  })}
                {STORE_LAYOUT_SEATS.map((seat) => {
                  if (floors !== "all" && floors !== seat.floor) return null;
                  if (seat.elevation || isGhostFloor(seat.floor)) return null;

                  const { depth, height, label, width, x, z } = seat;

                  return (
                    <group
                      key={`${seat.floor}-${x}-${z}`}
                      position={[
                        x + width / 2,
                        STORE_LAYOUT_FLOOR_BASE[seat.floor] + height / 2,
                        z + depth / 2,
                      ]}
                    >
                      <ItemAnnotations
                        depth={depth}
                        height={height}
                        label={
                          showLabels ? tStoreLayout(`items.${label}`) : null
                        }
                        showDimensions={showDimensions}
                        width={width}
                      />
                    </group>
                  );
                })}
                {STORE_LAYOUT_FLOORS.map((value) => {
                  if (floors !== "all" && floors !== value) return null;
                  if (isGhostFloor(value)) return null;

                  const { depth, width, x, z } = STORE_LAYOUT_ELEVATOR.shaft;

                  return (
                    <group
                      key={`elevator-${value}`}
                      position={[
                        x + width / 2,
                        STORE_LAYOUT_FLOOR_BASE[value] +
                          STORE_LAYOUT_FLOOR_HEIGHT / 2,
                        z + depth / 2,
                      ]}
                    >
                      <ItemAnnotations
                        depth={depth}
                        height={STORE_LAYOUT_FLOOR_HEIGHT}
                        label={null}
                        showDimensions={showDimensions}
                        width={width}
                      />
                    </group>
                  );
                })}
                <Avatar
                  character={character}
                  controlsRef={controlsRef}
                  doorsRef={doorsRef}
                  elevatorRef={elevatorRef}
                  floor={floor}
                  onFloorChange={showFloor}
                  avatarRef={avatarRef}
                  touchRef={touchRef}
                  view={view}
                />
                <Elevator
                  elevatorRef={elevatorRef}
                  floors={floors}
                  isGhostFloor={isGhostFloor}
                  label={showLabels ? tStoreLayout("items.elevator") : null}
                  realistic={realistic}
                />
                <OrbitControls
                  maxPolarAngle={
                    view === "first" ? Math.PI / 2 + pitchLimit : Math.PI
                  }
                  minPolarAngle={
                    view === "first" ? Math.PI / 2 - pitchLimit : 0
                  }
                  ref={controlsRef}
                  {...STORE_LAYOUT_ZOOM_DISTANCE}
                  target={[...STORE_LAYOUT_VIEWS.iso.target]}
                />
              </Canvas>
            </KeyboardControls>
            <Joystick inputRef={touchRef} view={view} />
            <SummaryPaper variant="outlined">
              {FLOOR_SUMMARIES.map(({ floor: value, seats, tables }) => {
                if (floors !== "all" && floors !== value) return null;

                return (
                  <Typography component="div" key={value} variant="caption">
                    {tStoreLayout("summary", {
                      floor: tStoreLayout(`floors.${value}`),
                      occupied: tables.filter(({ tableNumber }) =>
                        tableOrders.has(tableNumber),
                      ).length,
                      seats,
                      tables: tables.length,
                    })}
                  </Typography>
                );
              })}
              <StatusLegend direction="row">
                {orderBoardStatusValues.map((status) => (
                  <Typography
                    color="textSecondary"
                    key={status}
                    variant="caption"
                  >
                    <StatusDot
                      style={{ backgroundColor: statusColor(status) }}
                    />
                    {tOrders(`status.${status}`)}
                  </Typography>
                ))}
              </StatusLegend>
            </SummaryPaper>
            <BottomBar onMouseDown={handleControlsMouseDown}>
              {!realistic && (
                <GridLegend aria-label={tStoreLayout("gridScale")}>
                  <LegendStack direction="row">
                    <GridCellLine />
                    <Typography color="textSecondary" variant="caption">
                      {tStoreLayout("gridLegend.cell")}
                    </Typography>
                  </LegendStack>
                  <LegendStack direction="row">
                    <GridSectionLine />
                    <Typography color="textSecondary" variant="caption">
                      {tStoreLayout("gridLegend.section")}
                    </Typography>
                  </LegendStack>
                </GridLegend>
              )}
              {nearbyTable && nearbyStatus && (
                <TablePrompt
                  onClick={() => handleTableSelect(nearbyTable)}
                  variant="outlined"
                >
                  <ReceiptLong fontSize="small" />
                  {tOrder("mode.dineIn.tableNumber.value", {
                    tableNumber: nearbyTable,
                  })}
                  <Chip
                    color={STATUS_COLORS[nearbyStatus]}
                    component="span"
                    label={tOrders(`status.${nearbyStatus}`)}
                    size="small"
                    variant="outlined"
                  />
                </TablePrompt>
              )}
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
            </BottomBar>
          </>
        )}
      </StyledPaper>
    </>
  );
};

export default StoreLayout;
