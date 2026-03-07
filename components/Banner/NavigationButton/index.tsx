import { Button, type SvgIconProps } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "direction",
})<{ direction: "prev" | "next" }>(({ direction, theme }) => ({
  position: "absolute",
  ...(direction === "prev"
    ? { left: theme.spacing(2) }
    : { right: theme.spacing(2) }),
  padding: 0,
  minWidth: 0,
  width: theme.spacing(4.5),
  height: theme.spacing(4.5),
  borderRadius: "50%",
  zIndex: 1,
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
