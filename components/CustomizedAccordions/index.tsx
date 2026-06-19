// https://mui.com/material-ui/react-accordion/#CustomizedAccordions.tsx

"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";

import CartItemList from "@/components/CartItemList";

import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import useCartTotals from "@/hooks/useCartTotals";

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  transition: theme.transitions.create("background-color"),
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  "& .MuiAccordionSummary-content": {
    margin: 0,
    paddingBlock: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2),
  },
}));

const StyledExpandMore = styled(ExpandMore, {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{ expanded: boolean }>(({ expanded, theme }) => ({
  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
  transition: theme.transitions.create(["color", "transform"]),
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: 0,
  borderTop: `1px solid ${theme.vars.palette.divider}`,
}));

interface CustomizedAccordionsProps {
  defaultExpanded?: boolean;
}

const CustomizedAccordions = ({
  defaultExpanded = true,
}: CustomizedAccordionsProps) => {
  const [expanded, setExpanded] = useState<string | false>(
    defaultExpanded ? "panel1" : false,
  );
  const isPanel1Expanded = expanded === "panel1";

  const { cartCurrency, cartTotalAmount } = useCartTotals();

  const { locale } = useParams();

  const tCommon = useTranslations("common");

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, newExpanded: boolean) =>
      setExpanded(newExpanded ? panel : false);

  return (
    <StyledAccordion
      disableGutters
      expanded={isPanel1Expanded}
      onChange={handleChange("panel1")}
      slotProps={{ transition: { unmountOnExit: true } }}
    >
      <StyledAccordionSummary aria-controls="panel1-content" id="panel1-header">
        <Typography component="span" flex={1} variant="subtitle1">
          {tCommon("totalAmount")}
        </Typography>
        <Typography
          color="primary"
          component="span"
          flex="auto"
          fontWeight="bold"
          textAlign="center"
          variant="h6"
        >
          {cartCurrency} {cartTotalAmount.toLocaleString(locale)}
        </Typography>
        <Box flex={1} display="flex" justifyContent="flex-end">
          <StyledExpandMore expanded={isPanel1Expanded} />
        </Box>
      </StyledAccordionSummary>
      <StyledAccordionDetails>
        <CartItemList compact />
      </StyledAccordionDetails>
    </StyledAccordion>
  );
};

export default CustomizedAccordions;
