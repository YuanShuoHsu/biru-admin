"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { ORDER_MODE } from "@/constants/orderMode";

import { Link, useRouter } from "@/i18n/navigation";

import { LocalOffer } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Card,
  Chip,
  type ChipProps,
  Typography,
} from "@mui/material";

import type { MyClaimableCoupon, MyCoupon } from "@/types/coupons";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const getStatus = (coupon: MyCoupon): "available" | "expired" | "used" => {
  if (coupon.usedAt) return "used";
  if (
    coupon.coupon.validThrough &&
    new Date(coupon.coupon.validThrough) < new Date()
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
  const tCommon = useTranslations("common");

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

  const sections: {
    items: (MyClaimableCoupon | MyCoupon)[];
    type: "claimable" | "mine";
  }[] = [
    { items: claimableCoupons, type: "claimable" },
    { items: coupons, type: "mine" },
  ];

  return (
    <>
      {sections.map(
        ({ items, type }) =>
          (type === "mine" || items.length > 0) && (
            <FormCard key={type}>
              <StyledCardHeader
                title={
                  <Typography color="primary" fontWeight="bold" variant="h6">
                    {tAuth(`settings.coupons.${type}`)}
                  </Typography>
                }
              />
              <StyledCardContent>
                {items.length === 0 && (
                  <Typography color="text.secondary" variant="body2">
                    {tAuth("settings.coupons.empty")}
                  </Typography>
                )}
                {items.map((item) => {
                  const coupon = "coupon" in item ? item.coupon : item;
                  const status =
                    "coupon" in item ? getStatus(item) : "available";

                  return (
                    <Card key={item.id} variant="outlined">
                      <StyledCardHeader
                        action={
                          "coupon" in item ? (
                            <Chip
                              color={STATUS_CHIP_COLORS[status]}
                              label={tAuth(`settings.coupons.status.${status}`)}
                              size="small"
                              variant="outlined"
                            />
                          ) : null
                        }
                        avatar={
                          <Avatar
                            sx={{
                              bgcolor:
                                status === "available"
                                  ? "primary.main"
                                  : "action.disabled",
                            }}
                          >
                            <LocalOffer fontSize="small" />
                          </Avatar>
                        }
                        slotProps={{
                          subheader: { variant: "caption" },
                          title: { variant: "subtitle2" },
                        }}
                        subheader={[
                          item.organizationName,
                          "source" in item &&
                            tAuth(`settings.coupons.source.${item.source}`),
                          coupon.validThrough &&
                            tAuth("settings.coupons.validUntil", {
                              date: format.dateTime(
                                new Date(coupon.validThrough),
                                "short",
                              ),
                            }),
                        ]
                          .filter(Boolean)
                          .join(tCommon("middleDot"))}
                        title={coupon.code}
                      />
                      <StyledCardContent>
                        <Typography
                          color={
                            status === "available" ? "primary" : "text.disabled"
                          }
                          fontWeight="bold"
                          variant="h5"
                        >
                          {coupon.discountType === "percentage"
                            ? `-${Number(coupon.discountValue)}%`
                            : `-${coupon.discountCurrency} ${Number(coupon.discountValue).toLocaleString(locale)}`}
                        </Typography>
                      </StyledCardContent>
                      {status === "available" && (
                        <StyledCardActions
                          disableSpacing
                          sx={{ alignItems: "flex-end" }}
                        >
                          {"coupon" in item ? (
                            item.organizationSlug && (
                              <Button
                                component={Link}
                                href={`/order/${ORDER_MODE.Pickup}/${item.organizationSlug}`}
                                size="small"
                                variant="outlined"
                              >
                                {tAuth("settings.coupons.use")}
                              </Button>
                            )
                          ) : (
                            <Button
                              loading={claimingId === item.id}
                              onClick={() => handleClaim(item)}
                              size="small"
                              variant="contained"
                            >
                              {tAuth("settings.coupons.claim")}
                            </Button>
                          )}
                        </StyledCardActions>
                      )}
                    </Card>
                  );
                })}
              </StyledCardContent>
            </FormCard>
          ),
      )}
    </>
  );
};

export default Coupons;
