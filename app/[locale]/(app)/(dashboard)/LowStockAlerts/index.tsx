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
      ingredients: { id: string; name: LocalizedText }[];
      organizationId: string;
    }) => {
      if (organizationId !== organization.id) return;

      enqueueSnackbar(
        tInventory("ingredients.lowStockReached", {
          names: format.list(
            ingredients.map(({ name }) => localize(name, locale)),
          ),
        }),
        { variant: "warning" },
      );
      mutate((key) => Array.isArray(key) && key[0] === ingredientsUrl);
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
