// https://nextjs.org/docs/app/api-reference/file-conventions/not-found
// https://next-intl.dev/docs/environments/error-files#not-foundjs

"use client";

import { useTranslations } from "next-intl";

import { Box, Link, Typography } from "@mui/material";

const NotFound = () => {
  const tCommon = useTranslations("common");

  return (
    <Box>
      <Typography variant="h2">{tCommon("notFound.title")}</Typography>
      <Typography variant="body1">{tCommon("notFound.description")}</Typography>
      <Link href="/">{tCommon("notFound.home")}</Link>
    </Box>
  );
};

export default NotFound;
