"use client";

import { useMemo } from "react";

import { alpha, useColorScheme, useTheme } from "@mui/material/styles";

// 圖表畫在 canvas 上吃不到 CSS 變數，要依目前色彩模式取實際色碼
export const useChartPalette = () => {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();

  const scheme = (mode === "system" ? systemMode : mode) ?? "light";
  const palette = theme.colorSchemes[scheme]?.palette ?? theme.palette;

  return useMemo(
    () => ({
      down: palette.error.main,
      downVolume: alpha(palette.error.main, 0.4),
      grid: palette.divider,
      lines: [
        palette.warning.main,
        palette.secondary.main,
        palette.info.main,
        palette.primary.main,
      ],
      text: palette.text.secondary,
      up: palette.success.main,
      upVolume: alpha(palette.success.main, 0.4),
    }),
    [palette],
  );
};

export type ChartPalette = ReturnType<typeof useChartPalette>;
