"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useRef } from "react";

import { ArrowUpward } from "@mui/icons-material";
import { styled } from "@mui/material/styles";

import type { StoreLayoutTouchInput } from "@/types/storeLayout";

import {
  BASE_SIZE,
  JUMP_SIZE,
  KNOB_SIZE,
  TRAVEL,
  joystickVector,
} from "./vector";

const Overlay = styled("div")({
  display: "none",
  position: "absolute",
  bottom: 16,
  left: 16,
  right: 16,
  alignItems: "flex-end",
  justifyContent: "space-between",
  pointerEvents: "none",

  "@media (hover: none) and (pointer: coarse)": {
    display: "flex",
  },
});

const Base = styled("div")(({ theme }) => ({
  position: "relative",
  width: BASE_SIZE,
  height: BASE_SIZE,
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: "50%",
  backgroundColor: `rgba(${theme.vars.palette.background.paperChannel} / 0.55)`,
  pointerEvents: "auto",
  touchAction: "none",
}));

const Knob = styled("div")(({ theme }) => ({
  position: "absolute",
  top: TRAVEL,
  left: TRAVEL,
  width: KNOB_SIZE,
  height: KNOB_SIZE,
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: "50%",
  backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.35)`,
}));

const Jump = styled("button")(({ theme }) => ({
  width: JUMP_SIZE,
  height: JUMP_SIZE,
  padding: 0,
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: "50%",
  backgroundColor: `rgba(${theme.vars.palette.background.paperChannel} / 0.55)`,
  color: theme.vars.palette.text.primary,
  pointerEvents: "auto",
  touchAction: "none",
}));

interface JoystickProps {
  inputRef: RefObject<StoreLayoutTouchInput>;
}

const Joystick = ({ inputRef }: JoystickProps) => {
  const tStoreLayout = useTranslations("storeLayout");

  const knobRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const setKnob = (x: number, y: number) => {
    if (knobRef.current)
      knobRef.current.style.transform = `translate(${x * TRAVEL}px, ${y * TRAVEL}px)`;
  };

  const setInput = (x: number, y: number) => {
    inputRef.current.sideways = x;
    inputRef.current.towards = -y;
    setKnob(x, y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = originRef.current;
    if (!origin || origin.id !== event.pointerId) return;

    const { x, y } = joystickVector(
      event.clientX - origin.x,
      event.clientY - origin.y,
    );

    setInput(x, y);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const { height, left, top, width } =
      event.currentTarget.getBoundingClientRect();

    originRef.current = {
      id: event.pointerId,
      x: left + width / 2,
      y: top + height / 2,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    handlePointerMove(event);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (originRef.current?.id !== event.pointerId) return;

    originRef.current = null;
    setInput(0, 0);
  };

  const handleJumpDown = () => {
    inputRef.current.jump = true;
  };

  const handleJumpUp = () => {
    inputRef.current.jump = false;
  };

  return (
    <Overlay>
      <Base
        aria-label={tStoreLayout("touchControls.move")}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="application"
      >
        <Knob ref={knobRef} />
      </Base>
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
    </Overlay>
  );
};

export default Joystick;
