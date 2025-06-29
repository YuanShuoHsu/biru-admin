// https://mui.com/material-ui/customization/breakpoints/

"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#607d8b", // blueGrey[500]
    },
    // secondary: {
    //   main: "#f8bbd0", // pink[100]
    // },
    // warning: {
    //   main: "#ffe0b2", // orange[100]
    // },
    // info: {
    //   main: "#bcaaa4", // brown[200]
    // },
    // success: {
    //   main: "#5d4037", // brown[700]
    // },
    // background: {
    //   default: "#fafafa", // grey[50]
    //   paper: "#fafafa",
    // },
    // text: {
    //   primary: "#212121", // grey[900]
    //   secondary: "#607d8b", // blueGrey[500]
    // },
  },
});

export default theme;
