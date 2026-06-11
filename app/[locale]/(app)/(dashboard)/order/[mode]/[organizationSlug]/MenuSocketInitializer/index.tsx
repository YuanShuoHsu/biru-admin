"use client";

import { useLocale } from "next-intl";
import { useSnackbar } from "notistack";
import { useEffect } from "react";

import { menuSocket } from "@/app/socket";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { useMenuStore } from "@/providers/menu-store-provider";

import type { OrderMenu } from "@/types/menus";

import { getErrorMessage } from "@/utils/errors";

interface MenuSocketInitializerProps {
  organizationId: string;
}

const MenuSocketInitializer = ({
  organizationId,
}: MenuSocketInitializerProps) => {
  const locale = useLocale();

  const { setMenu } = useMenuStore((state) => state);

  const { enqueueSnackbar } = useSnackbar();

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected) return;

    const initMenus = async () => {
      setMenu({ isLoading: true });

      try {
        const response: OrderMenu | null = await menuSocket
          .timeout(5000)
          .emitWithAck("orderMenu", { organizationId, lang: locale });

        setMenu({ menu: response });
      } catch (error) {
        setMenu({ menu: null });
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        setMenu({ isLoading: false });
      }
    };

    initMenus();
  }, [enqueueSnackbar, isConnected, locale, organizationId, setMenu]);

  return null;
};

export default MenuSocketInitializer;
