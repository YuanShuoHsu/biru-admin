"use client";

import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";
import { useSWRConfig } from "swr";

import { useOrganization } from "@/hooks/organizations";
import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import RouteTabs from "@/components/RouteTabs";

import { getErrorMessage } from "@/utils/errors";

const OrdersTabsLayout = ({ children }: { children: React.ReactNode }) => {
  const organization = useOrganization(useSearchParams().get("organization"));

  const { mutate } = useSWRConfig();

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected || !organization) return;

    menuSocket
      .timeout(5000)
      .emitWithAck("joinOrdersBoard", { organizationId: organization.id })
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );

    const ordersUrl = `/api/organizations/${organization.slug}/orders`;

    const handleUpdate = () =>
      mutate(
        (key) =>
          key === `${ordersUrl}/board/admin` ||
          (Array.isArray(key) && key[0] === ordersUrl),
      );

    menuSocket.on("orderUpdated", handleUpdate);

    return () => {
      menuSocket.off("orderUpdated", handleUpdate);
    };
  }, [isConnected, mutate, organization]);

  return (
    <>
      <RouteTabs
        ariaLabel="orders tabs"
        tabs={[{ path: "/orders/board" }, { path: "/orders/list" }]}
      />
      {children}
    </>
  );
};

export default OrdersTabsLayout;
