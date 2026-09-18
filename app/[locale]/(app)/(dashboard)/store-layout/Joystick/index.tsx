"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react";

import { ArrowUpward } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";

import nipplejs from "nipplejs";

import {
  STORE_LAYOUT_TOUCH_MEDIA,
  STORE_LAYOUT_TOUCH_QUERY,
} from "@/constants/storeLayout";

import type { StoreLayoutTouchInput } from "@/types/storeLayout";

const STICK_RADIUS = 50;
const STICK_SIDE_INSET = 100;
const STICK_BOTTOM_INSET = 128;
const EDGE_GAP = 16;

const subscribeTouch = (onChange: () => void) => {
  const query = window.matchMedia(STORE_LAYOUT_TOUCH_QUERY);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
};

const MOVE_POSITION = {
  bottom: `${STICK_BOTTOM_INSET}px`,
  left: `${STICK_SIDE_INSET}px`,
};

const LOOK_POSITION = {
  bottom: `${STICK_BOTTOM_INSET}px`,
  right: `${STICK_SIDE_INSET}px`,
};

const Zone = styled(Box)({
  position: "absolute",
  bottom: 0,
  width: "50%",
  height: "50%",
  display: "none",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "block",
  },
});

const MoveZone = styled(Zone)({ left: 0 });

const LookZone = styled(Zone)({ left: "50%" });

const Jump = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  right: EDGE_GAP,
  bottom: STICK_BOTTOM_INSET + STICK_RADIUS + EDGE_GAP,
  border: `1px solid ${theme.vars.palette.divider}`,
  color: theme.vars.palette.text.primary,
  display: "none",
  touchAction: "none",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "inline-flex",
  },
}));

interface JoystickProps {
  inputRef: RefObject<StoreLayoutTouchInput>;
}

const Joystick = ({ inputRef }: JoystickProps) => {
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

    document.addEventListener("fullscreenchange", reposition);

    return () => {
      document.removeEventListener("fullscreenchange", reposition);
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
    </>
  );
};

export default Joystick;
