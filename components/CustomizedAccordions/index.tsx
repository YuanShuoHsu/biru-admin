// https://mui.com/material-ui/react-accordion/#CustomizedAccordions.tsx

"use client";

import { useId } from "react";

import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  type AccordionProps,
  AccordionSummary,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  borderRadius: theme.vars.shape.borderRadius,
  transition: theme.transitions.create("background-color"),

  "&::before": {
    display: "none",
  },
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

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: 0,
  borderTop: `1px solid ${theme.vars.palette.divider}`,
}));

interface CustomizedAccordionsProps extends AccordionProps {
  summary: React.ReactNode;
}

const CustomizedAccordions = ({
  children,
  summary,
  ...props
}: CustomizedAccordionsProps) => {
  const id = useId();

  return (
    <StyledAccordion
      disableGutters
      slotProps={{ transition: { unmountOnExit: true } }}
      variant="outlined"
      {...props}
    >
      <StyledAccordionSummary
        aria-controls={`${id}-content`}
        expandIcon={<ExpandMore />}
        id={`${id}-header`}
      >
        {summary}
      </StyledAccordionSummary>
      <StyledAccordionDetails>{children}</StyledAccordionDetails>
    </StyledAccordion>
  );
};

export default CustomizedAccordions;
