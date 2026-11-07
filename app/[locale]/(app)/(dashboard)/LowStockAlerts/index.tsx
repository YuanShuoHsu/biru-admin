"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";
import { useSWRConfig } from "swr";

import {
  useOrganization,
  useSelectedMemberRole,
  useSelectedOrganizationSlug,
} from "@/hooks/organizations";
import { useSocketConnection } from "@/hooks/useSocketConnection";

import { emitMenuWithAck, menuSocket } from "@/app/socket";

import type { LocalizedText } from "@/types/locale";

import { getErrorMessage } from "@/utils/errors";
import { localize } from "@/utils/locale";
import { hasRolePermission } from "@/utils/organizations";

const LowStockAlerts = () => {
  const format = useFormatter();
  const locale = useLocale();
  const tInventory = useTranslations("inventory");

  const organization = useOrganization(useSelectedOrganizationSlug());
  const canReadInventory = hasRolePermission(useSelectedMemberRole(), {
    inventory: ["read"],
  });

  const { mutate } = useSWRConfig();

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected || !organization || !canReadInventory) return;

    emitMenuWithAck("joinInventory", { organizationId: organization.id }).catch(
      (error) => enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
    );

    const ingredientsUrl = `/api/organizations/${organization.slug}/ingredients`;

    const handleLowStock = ({
      ingredients,
      organizationId,
    }: {
      ingredients: { id: string; name: LocalizedText; oversold?: boolean }[];
      organizationId: string;
    }) => {
      if (organizationId !== organization.id) return;

      const namesOf = (matches: typeof ingredients) =>
        format.list(matches.map(({ name }) => localize(name, locale)));

      const oversold = ingredients.filter(({ oversold }) => oversold);
      const lowStock = ingredients.filter(({ oversold }) => !oversold);

      if (oversold.length)
        enqueueSnackbar(
          tInventory("ingredients.oversoldReached", {
            names: namesOf(oversold),
          }),
          { variant: "error" },
        );
      if (lowStock.length)
        enqueueSnackbar(
          tInventory("ingredients.lowStockReached", {
            names: namesOf(lowStock),
          }),
          { variant: "warning" },
        );
      const urls = new Set([
        ingredientsUrl,
        ...ingredients.map(
          ({ id }) => `/api/ingredients/${id}/inventory-transactions`,
        ),
      ]);
      mutate((key) => Array.isArray(key) && urls.has(key[0]));
    };

    menuSocket.on("lowStockReached", handleLowStock);

    return () => {
      menuSocket.off("lowStockReached", handleLowStock);
      menuSocket.emit("leaveInventory", {
        organizationId: organization.id,
      });
    };
  }, [
    canReadInventory,
    format,
    isConnected,
    locale,
    mutate,
    organization,
    tInventory,
  ]);

  return null;
};

export default LowStockAlerts;
