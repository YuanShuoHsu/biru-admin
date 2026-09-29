"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useEffect, useRef } from "react";

import { ArrowUpward } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";

import { STORE_LAYOUT_TOUCH_MEDIA } from "@/constants/storeLayout";

import type { StoreLayoutTouchInput } from "@/types/storeLayout";

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  gridRow: 2,
  gridColumn: 3,
  justifySelf: "end",
  border: `1px solid ${theme.vars.palette.divider}`,
  color: theme.vars.palette.text.primary,
  touchAction: "none",
  display: "none",
  pointerEvents: "auto",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "flex",
  },
}));

interface JumpButtonProps {
  inputRef: RefObject<StoreLayoutTouchInput>;
}

const JumpButton = ({ inputRef }: JumpButtonProps) => {
  const tStoreLayout = useTranslations("storeLayout");

  const jumpPointerRef = useRef<number | null>(null);

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
    <StyledIconButton
      aria-label={tStoreLayout("touchControls.jump")}
      onContextMenu={(event) => event.preventDefault()}
      onLostPointerCapture={handleJumpUp}
      onPointerCancel={handleJumpUp}
      onPointerDown={handleJumpDown}
      onPointerUp={handleJumpUp}
      size="large"
    >
      <ArrowUpward />
    </StyledIconButton>
  );
};

export default JumpButton;
