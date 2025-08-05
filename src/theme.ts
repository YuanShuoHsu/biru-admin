// https://mui.com/material-ui/customization/breakpoints/
// https://mui.com/material-ui/customization/css-theme-variables/configuration/#preventing-ssr-flickering
// https://mui.com/material-ui/customization/css-theme-variables/usage/#typescript

"use client";

import { createTheme } from "@mui/material/styles";
import type {} from "@mui/material/themeCssVarsAugmentation";

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
    MuiButton: {
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
