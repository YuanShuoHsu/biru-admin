"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { ORDER_MODE } from "@/constants/orderMode";

import { Link, useRouter } from "@/i18n/navigation";

import { LocalOffer } from "@mui/icons-material";
import { Avatar, Button, Card, CardActions, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { MyClaimableCoupon, MyCoupon } from "@/types/coupons";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  justifyContent: "space-between",
}));

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

      await fetcher(`/api/users/me/coupons/${coupon.id}/claim`, {
        method: "POST",
      });

      enqueueSnackbar(tAuth("coupons.claimSuccess", { code: coupon.code }), {
        variant: "success",
      });
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
                    {tAuth(`coupons.${type}`)}
                  </Typography>
                }
              />
              <StyledCardContent>
                {items.length === 0 && (
                  <Typography color="text.secondary" variant="body2">
                    {tAuth("coupons.empty")}
                  </Typography>
                )}
                {items.map((item) => {
                  const coupon = "coupon" in item ? item.coupon : item;

                  return (
                    <Card key={item.id} variant="outlined">
                      <StyledCardHeader
                        avatar={
                          <StyledAvatar>
                            <LocalOffer fontSize="small" />
                          </StyledAvatar>
                        }
                        slotProps={{
                          subheader: { variant: "caption" },
                          title: { variant: "subtitle2" },
                        }}
                        subheader={[
                          item.applicableOrganizationNames?.length &&
                            tAuth("coupons.limitedToStores", {
                              stores: format.list(
                                item.applicableOrganizationNames,
                                { type: "unit" },
                              ),
                            }),
                          "source" in item &&
                            tAuth(`coupons.source.${item.source}`),
                          coupon.validThrough &&
                            tAuth("coupons.validUntil", {
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
                      <StyledCardActions disableSpacing>
                        <Typography
                          color="primary"
                          fontWeight="bold"
                          variant="h5"
                        >
                          {coupon.discountType === "percentage"
                            ? `-${Number(coupon.discountValue)}%`
                            : `-${coupon.discountCurrency} ${Number(coupon.discountValue).toLocaleString(locale)}`}
                        </Typography>
                        {"coupon" in item ? (
                          <Button
                            component={Link}
                            href={
                              item.applicableOrganizationSlugs?.length === 1
                                ? `/order/${ORDER_MODE.Pickup}/${item.applicableOrganizationSlugs[0]}`
                                : `/order/${ORDER_MODE.Pickup}`
                            }
                            size="small"
                            variant="outlined"
                          >
                            {tAuth("coupons.use")}
                          </Button>
                        ) : (
                          <Button
                            loading={claimingId === item.id}
                            onClick={() => handleClaim(item)}
                            size="small"
                            variant="contained"
                          >
                            {tAuth("coupons.claim")}
                          </Button>
                        )}
                      </StyledCardActions>
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
