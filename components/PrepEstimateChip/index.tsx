"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import useSWR from "swr";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import { AccessTime } from "@mui/icons-material";
import { Chip, Tooltip } from "@mui/material";

import type { PrepEstimate } from "@/types/orders";

interface PrepEstimateChipProps {
  organizationSlug: string;
}

const PrepEstimateChip = ({ organizationSlug }: PrepEstimateChipProps) => {
  const tOrders = useTranslations("orders");

  const { data, error, mutate } = useSWR<PrepEstimate>(
    organizationSlug
      ? `/api/organizations/${organizationSlug}/orders/prep-estimate`
      : null,
  );

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected) return;

    const handleUpdate = () => {
      mutate();
    };

    handleUpdate();

    menuSocket.on("prepEstimateUpdated", handleUpdate);

    return () => {
      menuSocket.off("prepEstimateUpdated", handleUpdate);
    };
  }, [isConnected, mutate]);

  if (error || !data?.estimatedMinutes) return null;

  return (
    <Tooltip
      title={tOrders("prepEstimate.tooltip", {
        basis: tOrders(`prepEstimate.basis.${data.basis}`),
        count: data.queuedOrders,
      })}
    >
      <Chip
        color="primary"
        icon={<AccessTime />}
        label={tOrders("prepEstimate.label", {
          minutes: data.estimatedMinutes,
        })}
        variant="outlined"
      />
    </Tooltip>
  );
};

export default PrepEstimateChip;
