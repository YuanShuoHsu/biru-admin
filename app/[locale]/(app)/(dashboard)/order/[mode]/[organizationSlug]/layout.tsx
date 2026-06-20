import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import MenuSocketInitializer from "./MenuSocketInitializer";

import CartAnchorTemporaryDrawer from "@/components/CartAnchorTemporaryDrawer";

import { routing } from "@/i18n/routing";

import { MenuStoreProvider } from "@/providers/menu-store-provider";

import type { OrderMenu } from "@/types/menus";
import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface OrderModeOrganizationSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
    mode: string;
    organizationSlug: string;
  }>;
}

const OrderModeOrganizationSlugLayout = async ({
  children,
  params,
}: OrderModeOrganizationSlugLayoutProps) => {
  const { locale, organizationSlug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const organization = await fetcher<OrganizationResponse>(
    `/api/organizations/${organizationSlug}`,
  ).catch(() => null);
  if (!organization) return notFound();

  const initialMenu = await fetcher<OrderMenu>(
    `/api/organizations/${organization.id}/order-menu?lang=${locale}`,
  ).catch(() => null);

  return (
    <MenuStoreProvider initialMenu={initialMenu}>
      <MenuSocketInitializer organizationId={organization.id} />
      <CartAnchorTemporaryDrawer />
      {children}
    </MenuStoreProvider>
  );
};

export default OrderModeOrganizationSlugLayout;
