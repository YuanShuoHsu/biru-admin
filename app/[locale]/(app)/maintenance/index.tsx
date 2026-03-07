// https://github.com/wayou/t-rex-runner

"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@mui/material";

const Maintenance = () => {
  const tMaintenance = useTranslations("maintenance");

  return (
    <Typography color="primary" fontWeight="bold" variant="h4">
      {tMaintenance("title")}
    </Typography>
  );
};

export default Maintenance;
