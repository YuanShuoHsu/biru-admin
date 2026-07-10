"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";

import { ORDER_MODE } from "@/constants/orderMode";

import { Link } from "@/i18n/navigation";

import { LocalOffer } from "@mui/icons-material";
import {
  Button,
  Card,
  Chip,
  type ChipProps,
  Stack,
  Typography,
} from "@mui/material";

import type { MyCoupon } from "@/types/coupons";

const getStatus = (coupon: MyCoupon): "available" | "expired" | "used" => {
  if (coupon.usedAt) return "used";
  if (
    coupon.coupon.validUntil &&
    new Date(coupon.coupon.validUntil) < new Date()
  )
    return "expired";
  return "available";
};

const STATUS_CHIP_COLORS: Record<
  ReturnType<typeof getStatus>,
  ChipProps["color"]
> = {
  available: "success",
  expired: "default",
  used: "default",
};

interface CouponsProps {
  coupons: MyCoupon[];
}

const Coupons = ({ coupons }: CouponsProps) => {
  const format = useFormatter();

  const locale = useLocale();

  const tAuth = useTranslations("auth");

  if (coupons.length === 0)
    return (
      <Typography color="text.secondary" variant="body2">
        {tAuth("settings.coupons.empty")}
      </Typography>
    );

  return (
    <Stack gap={2}>
      {coupons.map((voucher) => {
        const status = getStatus(voucher);

        return (
          <Card key={voucher.id} sx={{ p: 2 }} variant="outlined">
            <Stack
              alignItems={{ sm: "center" }}
              direction={{ sm: "row" }}
              gap={1}
              justifyContent="space-between"
            >
              <Stack gap={0.5}>
                <Stack alignItems="center" direction="row" gap={1}>
                  <LocalOffer
                    color={status === "available" ? "primary" : "disabled"}
                    fontSize="small"
                  />
                  <Typography variant="subtitle2">
                    {voucher.coupon.code}
                  </Typography>
                  <Chip
                    color={STATUS_CHIP_COLORS[status]}
                    label={tAuth(`settings.coupons.status.${status}`)}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                <Typography color="text.secondary" variant="caption">
                  {voucher.organizationName}
                  {" · "}
                  {tAuth(`settings.coupons.source.${voucher.source}`)}
                  {voucher.coupon.validUntil &&
                    ` · ${tAuth("settings.coupons.validUntil", {
                      date: format.dateTime(
                        new Date(voucher.coupon.validUntil),
                        "short",
                      ),
                    })}`}
                </Typography>
              </Stack>
              <Stack alignItems="center" direction="row" gap={2}>
                <Typography color="primary" fontWeight="bold" variant="h6">
                  {voucher.coupon.discountType === "percentage"
                    ? `-${Number(voucher.coupon.discountValue)}%`
                    : `-${Number(voucher.coupon.discountValue).toLocaleString(locale)}`}
                </Typography>
                {status === "available" && voucher.organizationSlug && (
                  <Button
                    component={Link}
                    href={`/order/${ORDER_MODE.Pickup}/${voucher.organizationSlug}`}
                    size="small"
                    variant="outlined"
                  >
                    {tAuth("settings.coupons.use")}
                  </Button>
                )}
              </Stack>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
};

export default Coupons;
