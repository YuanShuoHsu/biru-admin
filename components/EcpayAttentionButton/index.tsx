"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { ReportProblemOutlined } from "@mui/icons-material";
import {
  Badge,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { EcpayAttentionItem } from "@/types/ecpay";

interface EcpayAttentionButtonProps {
  organizationSlug: string;
}

const EcpayAttentionButton = ({
  organizationSlug,
}: EcpayAttentionButtonProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");

  const { data: items = [] } = useSWR<EcpayAttentionItem[]>(
    organizationSlug
      ? `/api/organizations/${organizationSlug}/ecpay/attention`
      : null,
  );

  if (!items.length) return null;

  const handleClick = () =>
    setDialog({
      content: (
        <Stack divider={<Divider />} gap={1}>
          {items.map(
            ({ confirmationNumber, detail, occurredAt, orderNumber, type }) => (
              <Stack
                gap={0.25}
                key={`${type}-${confirmationNumber}-${occurredAt}`}
              >
                <Typography variant="subtitle2">
                  {tOrders(`attention.type.${type}`)}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {tOrders("attention.orderLabel", {
                    orderNumber: orderNumber || "-",
                  })}
                  {tCommon("delimiter")}
                  {format.dateTime(new Date(occurredAt), "short")}
                </Typography>
                {!!detail && (
                  <Typography color="error" variant="caption">
                    {detail}
                  </Typography>
                )}
              </Stack>
            ),
          )}
        </Stack>
      ),
      open: true,
      showConfirm: false,
      title: tOrders("attention.title"),
    });

  return (
    <Tooltip title={tOrders("attention.tooltip")}>
      <IconButton color="warning" onClick={handleClick} size="small">
        <Badge badgeContent={items.length} color="error">
          <ReportProblemOutlined fontSize="small" />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default EcpayAttentionButton;
