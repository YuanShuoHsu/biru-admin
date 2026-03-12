// https://mui.com/x/react-data-grid/components/
// https://mui.com/x/react-data-grid/components/toolbar/#GridToolbar.tsx

"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import {
  Cancel,
  FileDownload,
  FilterList,
  Search,
  ViewColumn,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ColumnsPanelTrigger,
  ExportCsv,
  ExportPrint,
  FilterPanelTrigger,
  QuickFilter,
  QuickFilterClear,
  QuickFilterControl,
  QuickFilterTrigger,
  Toolbar,
  ToolbarButton,
} from "@mui/x-data-grid";

const StyledBox = styled(Box)({
  flex: 1,
});

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginInline: theme.spacing(0.5),
}));

const StyledQuickFilter = styled(QuickFilter)({
  display: "grid",
  alignItems: "center",
});

const StyledToolbarButton = styled(ToolbarButton)<{ ownerState: OwnerState }>(
  ({ theme, ownerState }) => ({
    gridArea: "1 / 1",
    width: "min-content",
    height: "min-content",
    zIndex: 1,
    opacity: ownerState.expanded ? 0 : 1,
    pointerEvents: ownerState.expanded ? "none" : "auto",
    transition: theme.transitions.create(["opacity"]),
  }),
);

type OwnerState = {
  expanded: boolean;
};

const StyledTextField = styled(TextField)<{
  ownerState: OwnerState;
}>(({ theme, ownerState }) => ({
  gridArea: "1 / 1",
  overflowX: "clip",
  width: ownerState.expanded ? 260 : "var(--trigger-width)",
  opacity: ownerState.expanded ? 1 : 0,
  transition: theme.transitions.create(["width", "opacity"]),
}));

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    action?: ReactNode;
  }
}

interface CustomToolbarProps {
  action?: ReactNode;
}

const CustomToolbar = ({ action }: CustomToolbarProps) => {
  const tToolbar = useTranslations("dataGrid.toolbar");
  const [exportMenuTrigger, setExportMenuTrigger] =
    useState<HTMLElement | null>(null);
  const exportMenuOpen = Boolean(exportMenuTrigger);

  return (
    <Toolbar>
      <StyledBox>{action}</StyledBox>
      <Tooltip title={tToolbar("columns")}>
        <ColumnsPanelTrigger render={<ToolbarButton />}>
          <ViewColumn fontSize="small" />
        </ColumnsPanelTrigger>
      </Tooltip>
      <Tooltip title={tToolbar("filters")}>
        <FilterPanelTrigger
          render={(props, state) => (
            <ToolbarButton {...props} color="default">
              <Badge
                badgeContent={state.filterCount}
                color="primary"
                variant="dot"
              >
                <FilterList fontSize="small" />
              </Badge>
            </ToolbarButton>
          )}
        />
      </Tooltip>
      <StyledDivider flexItem orientation="vertical" variant="middle" />
      <Tooltip title={tToolbar("export.label")}>
        <ToolbarButton
          aria-controls="export-menu"
          aria-expanded={exportMenuOpen ? "true" : undefined}
          aria-haspopup="true"
          id="export-menu-trigger"
          onClick={({ currentTarget }) => setExportMenuTrigger(currentTarget)}
        >
          <FileDownload fontSize="small" />
        </ToolbarButton>
      </Tooltip>
      <Menu
        anchorEl={exportMenuTrigger}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        id="export-menu"
        onClose={() => setExportMenuTrigger(null)}
        open={exportMenuOpen}
        slotProps={{
          list: {
            "aria-labelledby": "export-menu-trigger",
          },
        }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <ExportPrint
          onClick={() => setExportMenuTrigger(null)}
          render={<MenuItem />}
        >
          {tToolbar("export.print")}
        </ExportPrint>
        <ExportCsv
          onClick={() => setExportMenuTrigger(null)}
          render={<MenuItem />}
        >
          {tToolbar("export.csv")}
        </ExportCsv>
        {/* Available to MUI X Premium users */}
        {/* <ExportExcel render={<MenuItem />}>
          Download as Excel
        </ExportExcel> */}
      </Menu>
      <StyledQuickFilter>
        <QuickFilterTrigger
          render={(triggerProps, state) => (
            <Tooltip enterDelay={0} title={tToolbar("search.label")}>
              <StyledToolbarButton
                {...triggerProps}
                aria-disabled={state.expanded}
                color="default"
                ownerState={{ expanded: state.expanded }}
              >
                <Search fontSize="small" />
              </StyledToolbarButton>
            </Tooltip>
          )}
        />
        <QuickFilterControl
          render={({ ref, ...controlProps }, state) => (
            <StyledTextField
              {...controlProps}
              aria-label={tToolbar("search.label")}
              inputRef={ref}
              ownerState={{ expanded: state.expanded }}
              placeholder={tToolbar("search.placeholder")}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: state.value ? (
                    <InputAdornment position="end">
                      <QuickFilterClear
                        aria-label={tToolbar("search.clear")}
                        edge="end"
                        material={{ sx: { marginRight: -0.75 } }}
                        size="small"
                      >
                        <Cancel fontSize="small" />
                      </QuickFilterClear>
                    </InputAdornment>
                  ) : null,
                  ...controlProps.slotProps?.input,
                },
                ...controlProps.slotProps,
              }}
            />
          )}
        />
      </StyledQuickFilter>
    </Toolbar>
  );
};

export default CustomToolbar;
