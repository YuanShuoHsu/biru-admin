// https://mui.com/x/react-data-grid/overlays/#NoRowsOverlayCustom.tsx

"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

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

const CustomNoRowsOverlay = () => {
  const tOverlays = useTranslations("dataGrid.overlays");

  return (
    <StyledOverlay>
      <StyledSvg
        aria-hidden
        fill="none"
        focusable="false"
        viewBox="0 0 452 257"
        width={96}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="primary"
          d="M348 69c-46.392 0-84 37.608-84 84s37.608 84 84 84 84-37.608 84-84-37.608-84-84-84Zm-104 84c0-57.438 46.562-104 104-104s104 46.562 104 104-46.562 104-104 104-104-46.562-104-104Z"
        />
        <path
          className="primary"
          d="M308.929 113.929c3.905-3.905 10.237-3.905 14.142 0l63.64 63.64c3.905 3.905 3.905 10.236 0 14.142-3.906 3.905-10.237 3.905-14.142 0l-63.64-63.64c-3.905-3.905-3.905-10.237 0-14.142Z"
        />
        <path
          className="primary"
          d="M308.929 191.711c-3.905-3.906-3.905-10.237 0-14.142l63.64-63.64c3.905-3.905 10.236-3.905 14.142 0 3.905 3.905 3.905 10.237 0 14.142l-63.64 63.64c-3.905 3.905-10.237 3.905-14.142 0Z"
        />
        <path
          className="secondary"
          d="M0 10C0 4.477 4.477 0 10 0h380c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 20 0 15.523 0 10ZM0 59c0-5.523 4.477-10 10-10h231c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 69 0 64.523 0 59ZM0 106c0-5.523 4.477-10 10-10h203c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 153c0-5.523 4.477-10 10-10h195.5c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 200c0-5.523 4.477-10 10-10h203c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 247c0-5.523 4.477-10 10-10h231c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10Z"
        />
      </StyledSvg>
      <Typography variant="body2">{tOverlays("noRows")}</Typography>
    </StyledOverlay>
  );
};

export default CustomNoRowsOverlay;
