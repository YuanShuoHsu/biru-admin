// https://mui.com/material-ui/customization/breakpoints/
// https://mui.com/material-ui/customization/css-theme-variables/configuration/#preventing-ssr-flickering
// https://mui.com/material-ui/customization/css-theme-variables/usage/#typescript
// https://mui.com/material-ui/integrations/routing/
// https://mui.com/x/react-data-grid/style/#StripedGrid.tsx
// https://mui.com/x/react-data-grid/style/#SxProp.tsx
// https://mui.com/x/react-date-pickers/quickstart/#typescript
// https://mui.com/x/react-date-pickers/quickstart/#date-value-types

import LinkBehavior from "@/components/LinkBehavior";

import {
  APP_BAR_TOOLBAR_HEIGHT,
  APP_BAR_TOOLBAR_HEIGHT_SM_UP,
  APP_BAR_TOOLBAR_HEIGHT_XS_UP_LANDSCAPE,
} from "@/constants/appBar";

import type { LinkProps } from "@mui/material/Link";
import { alpha, createTheme } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";
import type {} from "@mui/x-data-grid/themeAugmentation";
import type {} from "@mui/x-date-pickers/AdapterDayjs";
import type {} from "@mui/x-date-pickers/themeAugmentation";

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
          main: "#a1887f", // brown[300]
        },
        success: {
          main: "#bcaaa4", // brown[200]
        },
        error: {
          main: "#f44336", // red[500]
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
          main: "#ffe0b2", // orange[100]
        },
        info: {
          main: "#bcaaa4", // brown[200]
        },
        success: {
          main: "#5d4037", // brown[700]
        },
        error: {
          main: "#e57373", // red[300]
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
    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create([
            "background-color",
            "border-color",
            "color",
          ]),
        }),
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: ({ theme }) => ({
          transition: theme.transitions.create([
            "background-color",
            "border-color",
          ]),
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: "none",
          transition: theme.transitions.create([
            "background-color",
            "border-color",
            "color",
          ]),
        }),
      },
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create([
            "background-color",
            "border-color",
            "color",
          ]),
        }),
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
      }),
    },
    MuiDataGrid: {
      styleOverrides: {
        cell: ({ theme }) => ({
          transition: theme.transitions.create(["border-color", "color"]),

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
          transition: theme.transitions.create([
            "background-color",
            "border-color",
            "color",
          ]),

          "& .MuiDataGrid-sortButton": {
            transition: theme.transitions.create("background-color"),
          },
        }),
        columnsManagement: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
        }),
        columnsManagementFooter: ({ theme }) => ({
          color: theme.vars.palette.text.primary,
        }),
        footerContainer: ({ theme }) => ({
          transition: theme.transitions.create(["border-color"]),
        }),
        root: ({ theme }) => ({
          transition: theme.transitions.create([
            "background-color",
            "border-color",
          ]),

          "& .MuiDataGrid-filler": {
            transition: theme.transitions.create([
              "background-color",
              "border-color",
            ]),

            "& > div": {
              transition: theme.transitions.create("border-color"),
            },
          },
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
        toolbar: ({ theme }) => ({
          transition: theme.transitions.create("border-color"),
        }),
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&::before, &::after": {
            transition: theme.transitions.create(["border-color"]),
          },
        }),
        wrapper: ({ theme }) => ({
          transition: theme.transitions.create("color"),
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create("background-color"),
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create([
            "max-width",
            "color",
            "transform",
          ]),
        }),
      },
    },
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      } as LinkProps,
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create("color"),
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
          transition: theme.transitions.create("border-color"),
        }),
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        displayedRows: ({ theme }) => ({
          transition: theme.transitions.create("color"),
        }),
        select: ({ theme }) => ({
          transition: theme.transitions.create("color"),
        }),
        selectLabel: ({ theme }) => ({
          transition: theme.transitions.create("color"),
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          transition: theme.transitions.create("background-color"),
        }),
        input: ({ theme }) => ({
          transition: theme.transitions.create("color"),
        }),
        notchedOutline: ({ theme }) => ({
          transition: theme.transitions.create("border-color"),
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create([
            "background-color",
            "border-color",
            "box-shadow",
          ]),
        }),
      },
    },
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          transition: theme.transitions.create("background-color"),
        }),
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create("color"),
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create([
            "background-color",
            "border-color",
          ]),
        }),
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: ({ theme }) => ({
          transition: theme.transitions.create("color"),
        }),
      },
    },
  },
  cssVariables: {
    colorSchemeSelector: "class",
  },
});

export default theme;
