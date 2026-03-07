"use client";

import { ViewList, ViewModule } from "@mui/icons-material";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useViewStore } from "@/providers/view-store-provider";

import { ViewMode } from "@/types/view";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.paper,
  transition: theme.transitions.create("background-color"),
}));

const ViewToggleButtons = () => {
  const { view, setView } = useViewStore((state) => state);

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    nextView: ViewMode | null,
  ) => {
    if (nextView !== null) setView(nextView);
  };

  return (
    <StyledToggleButtonGroup exclusive onChange={handleChange} value={view}>
      <ToggleButton aria-label="list" size="small" value="list">
        <ViewList />
      </ToggleButton>
      <ToggleButton aria-label="module" size="small" value="module">
        <ViewModule />
      </ToggleButton>
    </StyledToggleButtonGroup>
  );
};

export default ViewToggleButtons;
