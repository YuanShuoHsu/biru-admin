import { Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { getTypographyVariant } from "@/utils/soldOut";

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "inStock",
})<{ inStock: boolean }>(({ inStock, theme }) => ({
  position: "absolute",
  inset: 0,
  backgroundColor: `rgba(${theme.vars.palette.background.paperChannel} / 0.8)`,
  borderRadius: theme.shape.borderRadius,
  opacity: inStock ? 0 : 1,
  pointerEvents: inStock ? "none" : "auto",
  transition: theme.transitions.create([
    "background-color",
    "border-color",
    "opacity",
  ]),
  zIndex: 2,

  "&:hover": {
    backgroundColor: `rgba(${theme.vars.palette.error.mainChannel} / 0.2)`,
  },
}));

const StyledTypography = styled(Typography)({
  whiteSpace: "pre-line",
  wordBreak: "break-word",
  transform: "rotate(-30deg)",
});

interface ItemSoldOutProps {
  soldOutLabel: string;
}

const ItemSoldOut = ({ soldOutLabel }: ItemSoldOutProps) => {
  const message = soldOutLabel;

  const handleClick = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <StyledButton
      aria-label={message}
      color="error"
      disabled={!message}
      inStock={!message}
      onClick={handleClick}
      variant="outlined"
    >
      {message && (
        <StyledTypography
          color="error"
          fontWeight="bold"
          variant={getTypographyVariant(message)}
        >
          {message}
        </StyledTypography>
      )}
    </StyledButton>
  );
};

export default ItemSoldOut;
