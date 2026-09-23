// https://github.com/wayou/t-rex-runner

"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const Maintenance = () => {
  const tMaintenance = useTranslations("maintenance");

  return (
    <StyledTypography color="primary" variant="h4">
      {tMaintenance("title")}
    </StyledTypography>
  );
};

export default Maintenance;
