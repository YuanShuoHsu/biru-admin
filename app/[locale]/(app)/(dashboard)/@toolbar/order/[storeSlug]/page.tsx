import OrderSearch from "@/components/OrderSearch";
import ViewToggleButtons from "@/components/ViewToggleButtons";

import { Stack } from "@mui/material";

const OrderModeStoreSlugToolbar = () => (
  <Stack
    width={{ xs: "100%", sm: "auto" }}
    direction="row"
    justifyContent={{ xs: "space-between" }}
    alignItems="center"
    gap={2}
  >
    <OrderSearch />
    <ViewToggleButtons />
  </Stack>
);

export default OrderModeStoreSlugToolbar;
