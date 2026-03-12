// https://mui.com/x/react-data-grid/overlays/#NoColumnsOverlayCustom.tsx

"use client";

import { useTranslations } from "next-intl";

import { Button, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { GridPreferencePanelsValue, useGridApiContext } from "@mui/x-data-grid";

const StyledOverlay = styled("div")(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledSvg = styled("svg")(({ theme }) => ({
  "& .primary, & .secondary": {
    transition: theme.transitions.create("fill"),
  },
  "& .primary": {
    fill: theme.vars.palette.action.disabled,
  },
  "& .secondary": {
    fill: theme.vars.palette.action.hover,
  },
}));

const CustomNoColumnsOverlay = () => {
  const apiRef = useGridApiContext();

  const tOverlays = useTranslations("dataGrid.overlays");

  const handleOpenManageColumns = () => {
    apiRef.current.showPreferences(GridPreferencePanelsValue.columns);
  };

  return (
    <StyledOverlay>
      <StyledSvg
        aria-hidden
        fill="none"
        focusable="false"
        viewBox="0 0 370 260"
        width={96}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="secondary"
          d="M10 0c5.523 0 10 4.477 10 10v240c0 5.523-4.477 10-10 10s-10-4.477-10-10V10C0 4.477 4.477 0 10 0Zm50 0c5.523 0 10 4.477 10 10v240c0 5.523-4.477 10-10 10s-10-4.477-10-10V10c0-5.523 4.477-10 10-10Zm50 0c5.523 0 10 4.477 10 10v46c0 5.523-4.477 10-10 10s-10-4.477-10-10V10c0-5.523 4.477-10 10-10Zm50 0c5.523 0 10 4.477 10 10v19c0 5.523-4.477 10-10 10s-10-4.477-10-10V10c0-5.523 4.477-10 10-10Zm50 0c5.523 0 10 4.477 10 10v19c0 5.523-4.477 10-10 10s-10-4.477-10-10V10c0-5.523 4.477-10 10-10Zm50 0c5.523 0 10 4.477 10 10v46c0 5.523-4.477 10-10 10s-10-4.477-10-10V10c0-5.523 4.477-10 10-10Zm50 0c5.523 0 10 4.477 10 10v240c0 5.523-4.477 10-10 10s-10-4.477-10-10V10c0-5.523 4.477-10 10-10Zm50 0c5.523 0 10 4.477 10 10v240c0 5.523-4.477 10-10 10s-10-4.477-10-10V10c0-5.523 4.477-10 10-10ZM110 194c5.523 0 10 4.477 10 10v46c0 5.523-4.477 10-10 10s-10-4.477-10-10v-46c0-5.523 4.477-10 10-10Zm150 0c5.523 0 10 4.477 10 10v46c0 5.523-4.477 10-10 10s-10-4.477-10-10v-46c0-5.523 4.477-10 10-10Zm-100 27c5.523 0 10 4.477 10 10v19c0 5.523-4.477 10-10 10s-10-4.477-10-10v-19c0-5.523 4.477-10 10-10Zm50 0c5.523 0 10 4.477 10 10v19c0 5.523-4.477 10-10 10s-10-4.477-10-10v-19c0-5.523 4.477-10 10-10Z"
        />
        <path
          className="primary"
          d="M185 71c-32.585 0-59 26.415-59 59s26.415 59 59 59 59-26.415 59-59-26.415-59-59-59Zm-79 59c0-43.63 35.37-79 79-79s79 35.37 79 79c0 43.631-35.37 79-79 79s-79-35.369-79-79Zm109.296-30.56c3.905 3.905 3.905 10.236 0 14.142l-16.286 16.286 16.286 16.286c3.905 3.905 3.905 10.237 0 14.142-3.905 3.905-10.237 3.905-14.142 0l-16.286-16.286-16.286 16.286c-3.905 3.905-10.237 3.905-14.142 0-3.906-3.905-3.906-10.237 0-14.142l16.286-16.286-16.286-16.286c-3.906-3.905-3.906-10.237 0-14.142 3.905-3.906 10.237-3.906 14.142 0l16.286 16.286 16.286-16.286c3.905-3.906 10.237-3.906 14.142 0Z"
        />
      </StyledSvg>
      <Stack alignItems="center" gap={1}>
        <Typography variant="body2">{tOverlays("noColumns")}</Typography>
        <Button onClick={handleOpenManageColumns} size="small">
          {tOverlays("manageColumns")}
        </Button>
      </Stack>
    </StyledOverlay>
  );
};

export default CustomNoColumnsOverlay;
