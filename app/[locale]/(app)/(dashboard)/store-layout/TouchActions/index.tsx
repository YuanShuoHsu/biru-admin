"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useEffect, useRef, useState } from "react";

import { ArrowUpward } from "@mui/icons-material";
import { Box, IconButton, Slider } from "@mui/material";
import { styled } from "@mui/material/styles";

import { STORE_LAYOUT_TOUCH_MEDIA } from "@/constants/storeLayout";

import type {
  StoreLayoutTouchInput,
  StoreLayoutView,
} from "@/types/storeLayout";

const ZOOM_LEVER_LENGTH = 160;

const touchOnly = {
  display: "none",
  pointerEvents: "auto",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "flex",
  },
} as const;

const LeverTrack = styled(Box)(({ theme }) => ({
  ...touchOnly,
  gridRow: 2,
  gridColumn: 3,
  justifySelf: "end",
  height: ZOOM_LEVER_LENGTH,
  maxHeight: "100%",
  paddingBlock: theme.spacing(1.5),
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
}));

const Jump = styled(IconButton)(({ theme }) => ({
  ...touchOnly,
  gridRow: 3,
  gridColumn: 3,
  justifySelf: "end",
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
    <LeverTrack>
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

interface TouchActionsProps {
  inputRef: RefObject<StoreLayoutTouchInput>;
  view: StoreLayoutView;
}

const TouchActions = ({ inputRef, view }: TouchActionsProps) => {
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
    <>
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
    </>
  );
};

export default TouchActions;
