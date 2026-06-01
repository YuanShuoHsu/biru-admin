"use client";

import { useLocale } from "next-intl";
import { useSnackbar } from "notistack";
import { useEffect } from "react";

import { menuSocket } from "@/app/socket";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { useMenuStore } from "@/providers/menu-store-provider";

import { getErrorMessage } from "@/utils/errors";

interface MenuSocketInitializerProps {
  storeId: string;
}

const MenuSocketInitializer = ({ storeId }: MenuSocketInitializerProps) => {
  const locale = useLocale();

  const { setMenu } = useMenuStore((state) => state);

  const { enqueueSnackbar } = useSnackbar();

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected) return;

    const initMenus = async () => {
      setMenu({ isLoading: true });

      try {
        const response = await menuSocket
          .timeout(5000)
          .emitWithAck("orderMenu", { storeId, lang: locale });

        setMenu({ menus: response });
      } catch (error) {
        setMenu({ menus: [] });
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        setMenu({ isLoading: false });
      }
    };

    initMenus();
  }, [enqueueSnackbar, isConnected, locale, setMenu, storeId]);

  return null;
};

export default MenuSocketInitializer;
