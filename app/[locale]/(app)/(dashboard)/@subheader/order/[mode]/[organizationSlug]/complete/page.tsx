import OrderModeDineInStoreSlugTableNumberDisplay from "@/components/OrderModeDineInStoreSlugTableNumberDisplay";
import OrderModeDineInStoreSlugTableNumberSelect from "@/components/OrderModeDineInStoreSlugTableNumberSelect";

import { ORDER_MODE } from "@/constants/orderMode";

import { Stack } from "@mui/material";

interface SubheaderOrderModeOrganizationSlugCompletePageProps {
  params: Promise<{ mode: string; organizationSlug: string }>;
  searchParams: Promise<{ tableNumber?: string; partySize?: string }>;
}

const SubheaderOrderModeOrganizationSlugCompletePage = async ({
  params,
  searchParams,
}: SubheaderOrderModeOrganizationSlugCompletePageProps) => {
  const [{ mode, organizationSlug }, { tableNumber, partySize }] =
    await Promise.all([params, searchParams]);

  if (mode !== ORDER_MODE.DineIn || !tableNumber || !partySize) return null;

  return (
    <Stack
      direction="row"
      justifyContent={{ sm: "flex-end" }}
      alignItems="center"
      gap={2}
    >
      <OrderModeDineInStoreSlugTableNumberDisplay tableNumber={tableNumber} />
      <OrderModeDineInStoreSlugTableNumberSelect
        organizationSlug={organizationSlug}
        partySize={partySize}
        tableNumber={tableNumber}
      />
    </Stack>
  );
};

export default SubheaderOrderModeOrganizationSlugCompletePage;
