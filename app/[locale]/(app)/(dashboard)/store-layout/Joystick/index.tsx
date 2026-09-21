"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react";

import { ArrowUpward, DirectionsRun } from "@mui/icons-material";
import { Box, IconButton, Stack } from "@mui/material";
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

const Actions = styled(Stack)(({ theme }) => ({
  position: "absolute",
  right: EDGE_GAP,
  bottom: STICK_BOTTOM_INSET + STICK_RADIUS + EDGE_GAP,
  flexDirection: "column-reverse",
  gap: theme.spacing(1),
  display: "none",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "flex",
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  border: `1px solid ${theme.vars.palette.divider}`,
  color: theme.vars.palette.text.primary,
  touchAction: "none",
}));

const useHold = (onHold: (pressed: boolean) => void) => {
  const pointerRef = useRef<number | null>(null);

  const release = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (pointerRef.current !== event.pointerId) return;

    pointerRef.current = null;
    onHold(false);
  };

  return {
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
    onLostPointerCapture: release,
    onPointerCancel: release,
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();

      if (pointerRef.current !== null) return;

      pointerRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      onHold(true);
    },
    onPointerUp: release,
  };
};

interface JoystickProps {
  inputRef: RefObject<StoreLayoutTouchInput>;
}

const Joystick = ({ inputRef }: JoystickProps) => {
  const tStoreLayout = useTranslations("storeLayout");
  const theme = useTheme();

  const moveZoneRef = useRef<HTMLDivElement>(null);
  const lookZoneRef = useRef<HTMLDivElement>(null);

  const jump = useHold((pressed) => {
    inputRef.current.jump = pressed;
  });
  const sprint = useHold((pressed) => {
    inputRef.current.sprint = pressed;
  });

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
      inputRef.current.sprint = false;
    },
    [inputRef],
  );

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
      <Actions>
        <ActionButton
          aria-label={tStoreLayout("touchControls.jump")}
          size="large"
          {...jump}
        >
          <ArrowUpward />
        </ActionButton>
        <ActionButton
          aria-label={tStoreLayout("touchControls.sprint")}
          size="large"
          {...sprint}
        >
          <DirectionsRun />
        </ActionButton>
      </Actions>
    </>
  );
};

export default Joystick;
