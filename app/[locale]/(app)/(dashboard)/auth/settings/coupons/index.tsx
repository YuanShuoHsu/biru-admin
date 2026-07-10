"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

import { ORDER_MODE } from "@/constants/orderMode";

import { Link, useRouter } from "@/i18n/navigation";

import { LocalOffer } from "@mui/icons-material";
import {
  Button,
  Card,
  Chip,
  type ChipProps,
  Stack,
  Typography,
} from "@mui/material";

import type { MyClaimableCoupon, MyCoupon } from "@/types/coupons";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

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
  claimableCoupons: MyClaimableCoupon[];
  coupons: MyCoupon[];
}

const Coupons = ({ claimableCoupons, coupons }: CouponsProps) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const format = useFormatter();

  const locale = useLocale();

  const router = useRouter();

  const tAuth = useTranslations("auth");

  const handleClaim = async (coupon: MyClaimableCoupon) => {
    try {
      setClaimingId(coupon.id);

      await fetcher(
        `/api/organizations/${coupon.organizationSlug}/coupons/${coupon.id}/claim`,
        { method: "POST" },
      );

      enqueueSnackbar(
        tAuth("settings.coupons.claimSuccess", { code: coupon.code }),
        { variant: "success" },
      );
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setClaimingId(null);

      router.refresh();
    }
  };

  return (
    <Stack gap={3}>
      {claimableCoupons.length > 0 && (
        <Stack gap={2}>
          <Typography fontWeight="bold" variant="subtitle1">
            {tAuth("settings.coupons.claimable")}
          </Typography>
          {claimableCoupons.map((coupon) => (
            <Card key={coupon.id} sx={{ p: 2 }} variant="outlined">
              <Stack
                alignItems={{ sm: "center" }}
                direction={{ sm: "row" }}
                gap={1}
                justifyContent="space-between"
              >
                <Stack gap={0.5}>
                  <Stack alignItems="center" direction="row" gap={1}>
                    <LocalOffer color="primary" fontSize="small" />
                    <Typography variant="subtitle2">{coupon.code}</Typography>
                  </Stack>
                  <Typography color="text.secondary" variant="caption">
                    {coupon.organizationName}
                    {coupon.validUntil &&
                      ` · ${tAuth("settings.coupons.validUntil", {
                        date: format.dateTime(
                          new Date(coupon.validUntil),
                          "short",
                        ),
                      })}`}
                  </Typography>
                </Stack>
                <Stack alignItems="center" direction="row" gap={2}>
                  <Typography color="primary" fontWeight="bold" variant="h6">
                    {coupon.discountType === "percentage"
                      ? `-${Number(coupon.discountValue)}%`
                      : `-${coupon.discountCurrency} ${Number(coupon.discountValue).toLocaleString(locale)}`}
                  </Typography>
                  <Button
                    loading={claimingId === coupon.id}
                    onClick={() => handleClaim(coupon)}
                    size="small"
                    variant="contained"
                  >
                    {tAuth("settings.coupons.claim")}
                  </Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
      <Stack gap={2}>
        <Typography fontWeight="bold" variant="subtitle1">
          {tAuth("settings.coupons.mine")}
        </Typography>
        {coupons.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {tAuth("settings.coupons.empty")}
          </Typography>
        )}
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
                      : `-${voucher.coupon.discountCurrency} ${Number(voucher.coupon.discountValue).toLocaleString(locale)}`}
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
    </Stack>
  );
};

export default Coupons;
