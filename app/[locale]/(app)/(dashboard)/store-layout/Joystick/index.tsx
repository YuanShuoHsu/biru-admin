"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react";

import { ArrowUpward } from "@mui/icons-material";
import { styled, useTheme } from "@mui/material/styles";

import nipplejs from "nipplejs";

import type { StoreLayoutTouchInput } from "@/types/storeLayout";

const JUMP_SIZE = 64;
const STICK_RADIUS = 50;
const EDGE_GAP = 16;

const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";

const subscribeTouch = (onChange: () => void) => {
  const query = window.matchMedia(TOUCH_QUERY);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
};

const STICK_INSET = `max(20%, ${STICK_RADIUS + 8}px)`;

const MOVE_POSITION = { bottom: STICK_INSET, left: STICK_INSET };

const LOOK_POSITION = { bottom: STICK_INSET, right: STICK_INSET };

const Zone = styled("div")({
  display: "none",
  position: "absolute",
  bottom: 0,
  width: "50%",
  height: "50%",

  [`@media ${TOUCH_QUERY}`]: {
    display: "block",
  },
});

const MoveZone = styled(Zone)({ left: 0 });

const LookZone = styled(Zone)({ left: "50%" });

// 疊在右搖桿正上方，右拇指不必離開操作區；zone 佔半高，所以搖桿的 20% 在這裡是 10%
const Jump = styled("button")(({ theme }) => ({
  display: "none",
  position: "absolute",
  right: EDGE_GAP,
  bottom: `calc(max(10%, ${STICK_RADIUS + 8}px) + ${STICK_RADIUS + EDGE_GAP}px)`,
  width: JUMP_SIZE,
  height: JUMP_SIZE,
  padding: 0,
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: "50%",
  backgroundColor: `rgba(${theme.vars.palette.background.paperChannel} / 0.55)`,
  color: theme.vars.palette.text.primary,
  touchAction: "none",

  [`@media ${TOUCH_QUERY}`]: {
    display: "block",
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

  const touch = useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => false,
  );

  const back = `rgba(${theme.vars.palette.background.paperChannel} / 0.55)`;
  const moveFront = `rgba(${theme.vars.palette.primary.mainChannel} / 0.35)`;
  const lookFront = `rgba(${theme.vars.palette.secondary.mainChannel} / 0.35)`;

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
      zone: moveZone,
    });

    const look = nipplejs.create({
      color: { back, front: lookFront },
      mode: "static",
      position: LOOK_POSITION,
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

  const handleJumpDown = () => {
    inputRef.current.jump = true;
  };

  const handleJumpUp = () => {
    inputRef.current.jump = false;
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
        onPointerCancel={handleJumpUp}
        onPointerDown={handleJumpDown}
        onPointerLeave={handleJumpUp}
        onPointerUp={handleJumpUp}
        type="button"
      >
        <ArrowUpward fontSize="small" />
      </Jump>
    </>
  );
};

export default Joystick;
