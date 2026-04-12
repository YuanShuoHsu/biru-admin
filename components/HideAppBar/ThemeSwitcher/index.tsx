"use client";

// https://mui.com/material-ui/customization/css-theme-variables/configuration/
// https://mui.com/material-ui/customization/dark-mode/#ToggleColorMode.tsx
// https://mui.com/material-ui/react-tooltip/#DisabledTooltips.tsx

// https://github.com/mui/toolpad/blob/master/packages/toolpad-core/src/DashboardLayout/ThemeSwitcher.tsx

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import { DarkMode, LightMode } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { styled, useColorScheme } from "@mui/material/styles";

import { useSsr } from "@/utils/useSsr";

const StyledDarkMode = styled(DarkMode)(({ theme }) => ({
  display: "inline",

  [theme.getColorSchemeSelector("dark")]: {
    display: "none",
  },
}));

const StyledLightMode = styled(LightMode)(({ theme }) => ({
  display: "none",

  [theme.getColorSchemeSelector("dark")]: {
    display: "inline",
  },
}));

const ThemeSwitcher = () => {
  const { mode, setMode } = useColorScheme();
  const isSsr = useSsr();

  const tAppBar = useTranslations("appBar");

  const tooltipTitle = isSsr
    ? tAppBar("switchMode")
    : mode === "dark"
      ? tAppBar("lightMode")
      : tAppBar("darkMode");

  const ariaLabel = isSsr
    ? tAppBar("switchThemeMode")
    : mode === "dark"
      ? tAppBar("switchToLightMode")
      : tAppBar("switchToDarkMode");

  const toggleMode = useCallback(
    () => setMode(mode === "dark" ? "light" : "dark"),
    [mode, setMode],
  );

  return (
    <Tooltip title={tooltipTitle} enterDelay={1000}>
      <span>
        <IconButton aria-label={ariaLabel} color="inherit" onClick={toggleMode}>
          <StyledDarkMode />
          <StyledLightMode />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default ThemeSwitcher;
