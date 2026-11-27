"use client";

import { useLayoutEffect } from "react";

import { useColorScheme } from "@mui/material/styles";

const ColorSchemeTransitionGuard = () => {
  const { colorScheme } = useColorScheme();

  // 須放在 ThemeProvider 之內，layout effect 才會早於它換 class；MUI 的 disableTransitionOnChange 沒強制重算樣式就移除，第一次切換會漏
  useLayoutEffect(() => {
    const style = document.createElement("style");
    style.append("*,*::before,*::after{transition:none!important}");
    document.head.append(style);

    queueMicrotask(() => {
      document.body.getBoundingClientRect();
      style.remove();
    });
  }, [colorScheme]);

  return null;
};

export default ColorSchemeTransitionGuard;
