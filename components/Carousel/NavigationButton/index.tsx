import { Button, type SvgIconProps } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "direction",
})<{ direction: "prev" | "next" }>(({ direction, theme }) => ({
  position: "absolute",
  top: "50%",
  ...(direction === "prev"
    ? { left: theme.spacing(2) }
    : { right: theme.spacing(2) }),
  transform: "translateY(-50%)",
  padding: 0,
  minWidth: 0,
  width: theme.spacing(4.5),
  height: theme.spacing(4.5),
  borderRadius: "50%",
  zIndex: 1,
  transition: theme.transitions.create([
    "background-color",
    "border-color",
    "color",
    "opacity",
  ]),

  "&.swiper-button-disabled": {
    opacity: 0.5,
  },

  "&.swiper-button-lock": {
    display: "none",
  },
}));

interface NavigationButtonProps {
  direction: "prev" | "next";
  icon: React.ComponentType<SvgIconProps>;
}

const NavigationButton = ({ direction, icon: Icon }: NavigationButtonProps) => (
  <StyledButton
    className={`custom-swiper-button-${direction}`}
    direction={direction}
    variant="contained"
  >
    <Icon />
  </StyledButton>
);

export default NavigationButton;
