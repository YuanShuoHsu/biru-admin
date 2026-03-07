"use client";

import { useTranslations } from "next-intl";

import { Typography } from "@mui/material";

const Copyright = () => {
  const tHome = useTranslations("home");

  const copyrightLine = tHome("footer.copyright", {
    year: new Date().getFullYear(),
    brand: tHome("footer.brand"),
  });

  return (
    <Typography color="text.secondary" variant="caption">
      {copyrightLine}
    </Typography>
  );
};

export default Copyright;
