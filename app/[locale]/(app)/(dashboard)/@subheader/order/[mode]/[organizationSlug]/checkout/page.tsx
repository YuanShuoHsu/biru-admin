import OrderTableNumberChip from "@/components/OrderTableNumberChip";
import OrderPartySizeTextField from "@/components/OrderPartySizeTextField";

import { ORDER_MODE } from "@/constants/orderMode";

import { Stack } from "@mui/material";

interface SubheaderOrderModeOrganizationSlugCheckoutPageProps {
  params: Promise<{ mode: string; organizationSlug: string }>;
  searchParams: Promise<{ tableNumber?: string; partySize?: string }>;
}

const SubheaderOrderModeOrganizationSlugCheckoutPage = async ({
  params,
  searchParams,
}: SubheaderOrderModeOrganizationSlugCheckoutPageProps) => {
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
      <OrderTableNumberChip tableNumber={tableNumber} />
      <OrderPartySizeTextField
        organizationSlug={organizationSlug}
        partySize={partySize}
        tableNumber={tableNumber}
      />
    </Stack>
  );
};

export default SubheaderOrderModeOrganizationSlugCheckoutPage;
