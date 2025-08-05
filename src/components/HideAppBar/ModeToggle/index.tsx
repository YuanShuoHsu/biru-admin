// https://mui.com/material-ui/customization/dark-mode/#ToggleColorMode.tsx

import { useI18n } from "@/context/i18n";

import { DarkMode, LightMode } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

const ModeToggle = () => {
  const { mode, setMode } = useColorScheme();

  const dict = useI18n();
  if (!mode) return null;

  const isLight = mode === "light";
  const tooltipTitle = isLight ? dict.appBar.darkMode : dict.appBar.lightMode;

  const handleModeToggle = () => setMode(isLight ? "dark" : "light");

  return (
    <Tooltip title={tooltipTitle}>
      <IconButton
        aria-label={tooltipTitle}
        color="inherit"
        onClick={handleModeToggle}
      >
        {isLight ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ModeToggle;
