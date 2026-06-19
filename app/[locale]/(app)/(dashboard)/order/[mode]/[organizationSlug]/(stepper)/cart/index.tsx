"use client";

import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";

import CustomizedAccordions from "@/components/CustomizedAccordions";

import { useRouter } from "@/i18n/navigation";

import { MenuBook, ShoppingCartCheckout } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";

import { useCartStore } from "@/providers/cart-store-provider";

const OrderModeOrganizationSlugCart = () => {
  const { isCartEmpty } = useCartStore((state) => state);

  const { mode, organizationSlug } = useParams<{
    mode: string;
    organizationSlug: string;
  }>();

  const router = useRouter();

  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";

  const tOrder = useTranslations("order");

  return (
    <>
      <CustomizedAccordions />
      <Stack direction="row" justifyContent="space-between">
        <Button
          color="success"
          onClick={() =>
            router.push(`/order/${mode}/${organizationSlug}${query}`)
          }
          startIcon={<MenuBook />}
          variant="outlined"
        >
          {tOrder("cart.back")}
        </Button>
        <Button
          disabled={isCartEmpty}
          endIcon={<ShoppingCartCheckout />}
          onClick={() =>
            router.push(`/order/${mode}/${organizationSlug}/checkout${query}`)
          }
          variant="contained"
        >
          {tOrder("cart.next")}
        </Button>
      </Stack>
    </>
  );
};

export default OrderModeOrganizationSlugCart;
