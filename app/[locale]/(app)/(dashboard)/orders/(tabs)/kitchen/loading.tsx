// https://nextjs.org/docs/app/guides/streaming#page-level-streaming-with-loadingjs

import { Grid, Skeleton, Stack } from "@mui/material";

const OrdersKitchenLoading = () => (
  <Stack aria-busy spacing={2}>
    <Skeleton height={48} variant="rounded" />
    <Grid container spacing={2}>
      {Array.from({ length: 4 }, (_, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>
          <Skeleton height={240} variant="rounded" />
        </Grid>
      ))}
    </Grid>
  </Stack>
);

export default OrdersKitchenLoading;
