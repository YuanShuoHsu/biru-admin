"use client";

import { useTranslations } from "next-intl";
import {
  type RefObject,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { OpenWith, ThreeSixty } from "@mui/icons-material";
import { Box } from "@mui/material";
import { blueGrey, pink } from "@mui/material/colors";
import { type CSSObject, styled, useTheme } from "@mui/material/styles";

import nipplejs from "nipplejs";

import {
  STORE_LAYOUT_TOUCH_MEDIA,
  STORE_LAYOUT_TOUCH_QUERY,
} from "@/constants/storeLayout";

import type { StoreLayoutTouchInput } from "@/types/storeLayout";

const subscribeTouch = (onChange: () => void) => {
  const query = window.matchMedia(STORE_LAYOUT_TOUCH_QUERY);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
};

const TouchControls = styled(Box)({
  position: "absolute",
  inset: 0,
  display: "none",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "block",
  },
});

const Zone = styled(Box)({
  position: "absolute",
  top: 0,
  bottom: 0,
  width: "50%",
});

const MoveZone = styled(Zone)({ left: 0 });

const LookZone = styled(Zone)({ left: "50%" });

const knobIcon: CSSObject = {
  position: "absolute",
  inset: 0,
  margin: "auto",
};

const MoveIcon = styled(OpenWith)(({ theme }) => ({
  ...knobIcon,
  color: theme.vars.palette.common.white,
}));

const LookIcon = styled(ThreeSixty)(({ theme }) => ({
  ...knobIcon,
  color: theme.vars.palette.common.white,
}));

interface JoystickProps {
  inputRef: RefObject<StoreLayoutTouchInput>;
}

const Joystick = ({ inputRef }: JoystickProps) => {
  const tStoreLayout = useTranslations("storeLayout");
  const theme = useTheme();

  const moveZoneRef = useRef<HTMLDivElement>(null);
  const lookZoneRef = useRef<HTMLDivElement>(null);

  const [moveKnob, setMoveKnob] = useState<HTMLElement | null>(null);
  const [lookKnob, setLookKnob] = useState<HTMLElement | null>(null);

  const touch = useSyncExternalStore(
    subscribeTouch,
    () => window.matchMedia(STORE_LAYOUT_TOUCH_QUERY).matches,
    () => false,
  );

  const back = `rgba(${theme.vars.palette.text.primaryChannel} / 0.14)`;

  useEffect(() => {
    if (!touch) return;

    const moveZone = moveZoneRef.current;
    const lookZone = lookZoneRef.current;
    if (!moveZone || !lookZone) return;

    const input = inputRef.current;

    const move = nipplejs.create({
      color: { back, front: blueGrey[500] },
      mode: "dynamic",
      zone: moveZone,
    });

    const look = nipplejs.create({
      color: { back, front: pink[500] },
      mode: "dynamic",
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

    move.on("added", ({ data }) => setMoveKnob(data.ui.front));
    look.on("added", ({ data }) => setLookKnob(data.ui.front));
    move.on("removed", () => setMoveKnob(null));
    look.on("removed", () => setLookKnob(null));

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

    return () => {
      move.destroy();
      look.destroy();
      restMove();
      restLook();
      setMoveKnob(null);
      setLookKnob(null);
    };
  }, [back, inputRef, touch]);

  return (
    <TouchControls>
      <MoveZone
        aria-label={tStoreLayout("touchControls.move")}
        ref={moveZoneRef}
      />
      <LookZone
        aria-label={tStoreLayout("touchControls.look")}
        ref={lookZoneRef}
      />
      {moveKnob && createPortal(<MoveIcon />, moveKnob)}
      {lookKnob && createPortal(<LookIcon />, lookKnob)}
    </TouchControls>
  );
};

export default Joystick;
