// https://mui.com/material-ui/customization/breakpoints/
// https://mui.com/material-ui/customization/css-theme-variables/configuration/#preventing-ssr-flickering
// https://mui.com/material-ui/customization/css-theme-variables/usage/#typescript
// https://mui.com/material-ui/integrations/nextjs/#custom-font
// https://mui.com/material-ui/integrations/routing/
// https://mui.com/x/react-data-grid/style/#StripedGrid.tsx
// https://mui.com/x/react-data-grid/style/#SxProp.tsx
// https://mui.com/x/react-date-pickers/quickstart/#typescript
// https://mui.com/x/react-date-pickers/quickstart/#date-value-types
// https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:active-view-transition
// https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::view-transition-new

import LinkBehavior from "@/components/LinkBehavior";

import {
  APP_BAR_TOOLBAR_HEIGHT,
  APP_BAR_TOOLBAR_HEIGHT_SM_UP,
  APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
} from "@/constants/appBar";

import type { LinkProps } from "@mui/material/Link";
import { alpha, createTheme } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-charts/themeAugmentation";
import type {} from "@mui/x-data-grid/themeAugmentation";
import type {} from "@mui/x-date-pickers/AdapterDayjs";
import type {} from "@mui/x-date-pickers/themeAugmentation";
import type {} from "@mui/x-scheduler/theme-augmentation";

const theme = createTheme({
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          main: "#cfd8dc", // blueGrey[100]
        },
        secondary: {
          main: "#f48fb1", // pink[200]
        },
        warning: {
          main: "#ffcc80", // orange[200]
        },
        info: {
          main: "#80cbc4", // teal[200]
        },
        success: {
          main: "#a5d6a7", // green[200]
        },
        error: {
          main: "#ef9a9a", // red[200]
        },
        background: {
          default: "#212121", // grey[900]
          paper: "#263238", // blueGrey[900]
        },
        text: {
          primary: "#fafafa", // grey[50]
          secondary: "#eee", // grey[200]
        },
      },
    },
    light: {
      palette: {
        primary: {
          main: "#607d8b", // blueGrey[500]
        },
        secondary: {
          main: "#f8bbd0", // pink[100]
        },
        warning: {
          main: "#8f6000", // orange[900]
        },
        info: {
          main: "#00695c", // teal[800]
        },
        success: {
          main: "#2e7d32", // green[800]
        },
        error: {
          main: "#c62828", // red[800]
        },
        background: {
          default: "#eceff1", // blueGrey[50]
          paper: "#fff",
        },
        text: {
          primary: "#212121", // grey[900]
          secondary: "#616161", // grey[700]
        },
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          textTransform: "none",
          ...(ownerState.variant === "outlined" && {
            backgroundColor: theme.vars.palette.background.paper,
          }),
        }),
      },
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        ".notistack-container-top-right-offset": {
          top: `${APP_BAR_TOOLBAR_HEIGHT}px !important`,

          [`${theme.breakpoints.up("xs")} and (orientation: landscape)`]: {
            top: `${APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE}px !important`,
          },

          [theme.breakpoints.up("sm")]: {
            top: `${APP_BAR_TOOLBAR_HEIGHT_SM_UP}px !important`,
          },
        },
        ".notistack-MuiContent": {
          overflowWrap: "anywhere",
        },
        ":root:active-view-transition *": {
          transition: "none !important",
        },
        "::view-transition-old(root), ::view-transition-new(root)": {
          animationDuration: `${theme.transitions.duration.standard}ms`,
          animationTimingFunction: theme.transitions.easing.easeInOut,
        },
      }),
    },
    MuiDataGrid: {
      styleOverrides: {
        cell: ({ theme }) => ({
          transition: theme.transitions.create("color"),

          ".MuiChip-root": {
            transition: theme.transitions.create([
              "background-color",
              "border-color",
              "color",
            ]),
          },

          "&:hover": {
            color: theme.vars.palette.primary.main,

            ".MuiChip-root": {
              color: theme.vars.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              borderColor: theme.vars.palette.primary.main,
            },
          },
        }),
        columnHeader: ({ theme }) => ({
          "& .MuiDataGrid-sortButton": {
            transition: theme.transitions.create("background-color"),
          },
          "&:not(.MuiDataGrid-columnHeader--sorted) .MuiDataGrid-sortButton": {
            transition: [
              theme.transitions.create("background-color"),
              theme.transitions.create("opacity", {
                duration: theme.transitions.duration.short,
              }),
            ].join(","),
          },
        }),
        columnsManagement: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
        }),
        columnsManagementFooter: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
        }),
        row: ({ theme }) => ({
          transition: theme.transitions.create("background-color"),

          "&.even": {
            backgroundColor: theme.vars.palette.action.hover,

            "&:hover": {
              backgroundColor: theme.vars.palette.action.selected,

              "@media (hover: none)": {
                backgroundColor: theme.vars.palette.action.hover,
              },
            },
            "&.Mui-selected": {
              backgroundColor: theme.vars.palette.action.selected,

              "&:hover": {
                backgroundColor: theme.vars.palette.action.focus,

                "@media (hover: none)": {
                  backgroundColor: theme.vars.palette.action.selected,
                },
              },
            },
          },
        }),
      },
    },
    MuiDateTimePicker: {
      defaultProps: {
        ampm: false,
      },
    },
    MuiEventCalendar: {
      styleOverrides: {
        agendaView: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
        }),
        dayTimeGridContainer: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
        }),
        monthView: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
        }),
        sidePanel: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
        }),
      },
    },
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      } as LinkProps,
    },
    MuiTabs: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
        }),
      },
    },
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
        }),
      },
    },
  },
  cssVariables: {
    colorSchemeSelector: "class",
  },
  typography: {
    fontFamily: "var(--font-brand), sans-serif",
  },
});

export default theme;
