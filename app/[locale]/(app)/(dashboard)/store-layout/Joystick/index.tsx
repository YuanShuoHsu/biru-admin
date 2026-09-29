"use client";

import { useTranslations } from "next-intl";
import {
  type RefObject,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { ArrowUpward } from "@mui/icons-material";
import { Box, IconButton, Paper, Slider, Stack } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";

import nipplejs from "nipplejs";

import {
  STORE_LAYOUT_JOYSTICK,
  STORE_LAYOUT_TOUCH_MEDIA,
  STORE_LAYOUT_TOUCH_QUERY,
} from "@/constants/storeLayout";

import type {
  StoreLayoutTouchInput,
  StoreLayoutView,
} from "@/types/storeLayout";

const {
  edgeGap: EDGE_GAP,
  inset: STICK_INSET,
  radius: STICK_RADIUS,
} = STORE_LAYOUT_JOYSTICK;

const ZOOM_LEVER_LENGTH = 160;

const subscribeTouch = (onChange: () => void) => {
  const query = window.matchMedia(STORE_LAYOUT_TOUCH_QUERY);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
};

const MOVE_POSITION = { bottom: `${STICK_INSET}px`, left: `${STICK_INSET}px` };

const LOOK_POSITION = { bottom: `${STICK_INSET}px`, right: `${STICK_INSET}px` };

const Zone = styled(Box)({
  position: "absolute",
  top: 0,
  bottom: 0,
  width: "50%",
  display: "none",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "block",
  },
});

const MoveZone = styled(Zone)({ left: 0 });

const LookZone = styled(Zone)({ left: "50%" });

const EdgeControls = styled(Stack)({
  position: "absolute",
  top: EDGE_GAP,
  right: EDGE_GAP,
  bottom: STICK_INSET + STICK_RADIUS + EDGE_GAP,
  alignItems: "center",
  justifyContent: "flex-end",
  gap: EDGE_GAP,
  display: "none",
  pointerEvents: "none",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "flex",
  },

  "& > *": {
    pointerEvents: "auto",
  },
});

const LeverTrack = styled(Paper)(({ theme }) => ({
  flex: `0 1 ${ZOOM_LEVER_LENGTH}px`,
  minHeight: 0,
  paddingBlock: theme.spacing(1.5),
}));

const Jump = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.vars.palette.divider}`,
  color: theme.vars.palette.text.primary,
  touchAction: "none",
}));

interface ZoomLeverProps {
  inputRef: RefObject<StoreLayoutTouchInput>;
}

const ZoomLever = ({ inputRef }: ZoomLeverProps) => {
  const tStoreLayout = useTranslations("storeLayout");

  const [zoom, setZoom] = useState(0);

  useEffect(
    () => () => {
      inputRef.current.zoom = 0;
    },
    [inputRef],
  );

  const pushZoom = (value: number) => {
    inputRef.current.zoom = value;
    setZoom(value);
  };

  return (
    <LeverTrack variant="outlined">
      <Slider
        aria-label={tStoreLayout("touchControls.zoom")}
        max={1}
        min={-1}
        onChange={(_event, value) => pushZoom(value)}
        onChangeCommitted={() => pushZoom(0)}
        orientation="vertical"
        step={0.01}
        track={false}
        value={zoom}
      />
    </LeverTrack>
  );
};

interface JoystickProps {
  inputRef: RefObject<StoreLayoutTouchInput>;
  view: StoreLayoutView;
}

const Joystick = ({ inputRef, view }: JoystickProps) => {
  const tStoreLayout = useTranslations("storeLayout");
  const theme = useTheme();

  const moveZoneRef = useRef<HTMLDivElement>(null);
  const lookZoneRef = useRef<HTMLDivElement>(null);
  const jumpPointerRef = useRef<number | null>(null);

  const touch = useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(STORE_LAYOUT_TOUCH_QUERY).matches,
    () => false,
  );

  const back = `rgba(${theme.vars.palette.text.primaryChannel} / 0.14)`;
  const moveFront = theme.vars.palette.primary.main;
  const lookFront = theme.vars.palette.secondary.main;

  useEffect(() => {
    if (!touch) return;

    const moveZone = moveZoneRef.current;
    const lookZone = lookZoneRef.current;
    if (!moveZone || !lookZone) return;

    const input = inputRef.current;

    const move = nipplejs.create({
      color: { back, front: moveFront },
      mode: "static",
      position: MOVE_POSITION,
      restOpacity: 0.9,
      zone: moveZone,
    });

    const look = nipplejs.create({
      color: { back, front: lookFront },
      mode: "static",
      position: LOOK_POSITION,
      restOpacity: 0.9,
      zone: lookZone,
    });

    const restMove = () => {
      input.sideways = 0;
      input.towards = 0;
    };

    const restLook = () => {
      input.lookSideways = 0;
      input.lookVertical = 0;
    };

    move.on("move", ({ data }) => {
      input.sideways = data.vector.x;
      input.towards = data.vector.y;
    });

    look.on("move", ({ data }) => {
      input.lookSideways = data.vector.x;
      input.lookVertical = data.vector.y;
    });

    move.on("end", restMove);
    look.on("end", restLook);

    const reposition = () => {
      move.reposition();
      look.reposition();
    };

    const observer = new ResizeObserver(reposition);

    observer.observe(moveZone);
    observer.observe(lookZone);

    return () => {
      observer.disconnect();
      move.destroy();
      look.destroy();
      restMove();
      restLook();
    };
  }, [back, inputRef, lookFront, moveFront, touch]);

  useEffect(
    () => () => {
      inputRef.current.jump = false;
    },
    [inputRef],
  );

  const setJump = (pressed: boolean) => {
    inputRef.current.jump = pressed;
  };

  const handleJumpDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (jumpPointerRef.current !== null) return;

    jumpPointerRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setJump(true);
  };

  const handleJumpUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (jumpPointerRef.current !== event.pointerId) return;

    jumpPointerRef.current = null;
    setJump(false);
  };

  return (
    <>
      <MoveZone
        aria-label={tStoreLayout("touchControls.move")}
        ref={moveZoneRef}
      />
      <LookZone
        aria-label={tStoreLayout("touchControls.look")}
        ref={lookZoneRef}
      />
      <EdgeControls>
        {view !== "first" && <ZoomLever inputRef={inputRef} />}
        <Jump
          aria-label={tStoreLayout("touchControls.jump")}
          onContextMenu={(event) => event.preventDefault()}
          onLostPointerCapture={handleJumpUp}
          onPointerCancel={handleJumpUp}
          onPointerDown={handleJumpDown}
          onPointerUp={handleJumpUp}
          size="large"
        >
          <ArrowUpward />
        </Jump>
      </EdgeControls>
    </>
  );
};

export default Joystick;
