"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Clear, Search } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useOrderSearchStore } from "@/providers/order-search-store-provider";

const StyledTextField = styled(TextField)(({ theme }) => ({
  [theme.breakpoints.up("sm")]: {
    width: theme.spacing(30),
  },
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ theme, visible }) => ({
  opacity: visible ? 1 : 0,
  pointerEvents: visible ? "auto" : "none",
  transition: theme.transitions.create("opacity"),
}));

const OrderSearch = () => {
  const tOrder = useTranslations("order");

  const { clearOrderSearchText, orderSearchText, setOrderSearchText } =
    useOrderSearchStore((state) => state);

  useEffect(() => () => clearOrderSearchText(), [clearOrderSearchText]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setOrderSearchText(event.target.value);

  const handleClick = () => clearOrderSearchText();

  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) =>
    event.preventDefault();

  const handleMouseUp = (event: React.MouseEvent<HTMLButtonElement>) =>
    event.preventDefault();

  return (
    <StyledTextField
      fullWidth
      onChange={handleChange}
      placeholder={tOrder("mode.storeSlug.tableNumber.search.placeholder")}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <StyledIconButton
                aria-label="clear search"
                edge="end"
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                size="small"
                visible={!!orderSearchText}
              >
                <Clear fontSize="small" />
              </StyledIconButton>
            </InputAdornment>
          ),
        },
      }}
      size="small"
      value={orderSearchText}
    />
  );
};

export default OrderSearch;
