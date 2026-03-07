// https://nextjs.org/docs/app/api-reference/file-conventions/not-found

"use client";

import { Box, Link, Typography } from "@mui/material";

const NotFound = () => (
  <Box>
    <Typography color="text.primary" variant="h2">
      Not Found
    </Typography>
    <Typography color="text.primary" variant="body1">
      Could not find requested resource
    </Typography>
    <Link color="text.primary" href="/">
      Return Home
    </Link>
  </Box>
);

export default NotFound;
