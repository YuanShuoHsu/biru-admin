"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import useSWR from "swr";

import { query } from "@/constants/query";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Check, LocalOffer } from "@mui/icons-material";
import { Button, Card, Chip, Stack, Typography } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { ClaimableCoupon } from "@/types/coupons";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";

const CouponClaimSection = () => {
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const format = useFormatter();

  const locale = useLocale();

  const { organizationSlug } = useParams();

  const pathname = usePathname();

  const router = useRouter();

  const { session } = useAuthStore((state) => state);

  const tOrder = useTranslations("order");

  const { data: coupons = [], mutate } = useSWR<ClaimableCoupon[]>(
    `/api/organizations/${String(organizationSlug)}/coupons/claimable`,
  );

  if (coupons.length === 0) return null;

  const handleClaim = async (coupon: ClaimableCoupon) => {
    if (!session) {
      router.push(getHref("/sign-in", { [query.redirectTo]: pathname }));
      return;
    }

    try {
      setClaimingId(coupon.id);

      await fetcher(
        `/api/organizations/${String(organizationSlug)}/coupons/${coupon.id}/claim`,
        { method: "POST" },
      );

      enqueueSnackbar(tOrder("coupons.claimSuccess", { code: coupon.code }), {
        variant: "success",
      });

      mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      mutate();
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <Stack gap={1}>
      <Typography fontWeight="bold" variant="subtitle1">
        {tOrder("coupons.label")}
      </Typography>
      <Stack direction="row" gap={1} sx={{ overflowX: "auto", pb: 0.5 }}>
        {coupons.map((coupon) => (
          <Card
            key={coupon.id}
            sx={{ flexShrink: 0, minWidth: 240, p: 2 }}
            variant="outlined"
          >
            <Stack gap={1}>
              <Stack alignItems="center" direction="row" gap={0.5}>
                <LocalOffer color="primary" fontSize="small" />
                <Typography variant="subtitle2">{coupon.code}</Typography>
              </Stack>
              <Typography color="primary" fontWeight="bold" variant="h6">
                {coupon.discountType === "percentage"
                  ? `-${Number(coupon.discountValue)}%`
                  : `-${Number(coupon.discountValue).toLocaleString(locale)}`}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {coupon.validUntil
                  ? tOrder("coupons.validUntil", {
                      date: format.dateTime(
                        new Date(coupon.validUntil),
                        "short",
                      ),
                    })
                  : tOrder("coupons.noExpiry")}
              </Typography>
              {coupon.claimed ? (
                <Chip
                  color="success"
                  icon={<Check />}
                  label={tOrder("coupons.claimed")}
                  size="small"
                  variant="outlined"
                />
              ) : (
                <Button
                  loading={claimingId === coupon.id}
                  onClick={() => handleClaim(coupon)}
                  size="small"
                  variant="contained"
                >
                  {tOrder("coupons.claim")}
                </Button>
              )}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
};

export default CouponClaimSection;
