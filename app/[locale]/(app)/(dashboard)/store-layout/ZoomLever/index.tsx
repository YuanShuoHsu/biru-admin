"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useEffect, useState } from "react";

import { Box, Slider } from "@mui/material";
import { styled } from "@mui/material/styles";

import { STORE_LAYOUT_TOUCH_MEDIA } from "@/constants/storeLayout";

import type { StoreLayoutTouchInput } from "@/types/storeLayout";

const ZOOM_LEVER_LENGTH = 160;

const LeverTrack = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  height: ZOOM_LEVER_LENGTH,
  maxHeight: "100%",
  paddingBlock: theme.spacing(1),
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  display: "none",
  pointerEvents: "auto",

  [STORE_LAYOUT_TOUCH_MEDIA]: {
    display: "flex",
  },
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
        size="small"
        slotProps={{
          track: {
            style: {
              bottom: `${50 + Math.min(zoom, 0) * 50}%`,
              height: `${Math.abs(zoom) * 50}%`,
            },
          },
        }}
        step={0.01}
        value={zoom}
      />
    </LeverTrack>
  );
};

export default ZoomLever;
