"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { useRouter } from "@/i18n/navigation";

import { LocalOffer } from "@mui/icons-material";
import { Avatar, Button, Card, CardActions, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MyPointsWallet, PointsCoupon } from "@/types/points";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  justifyContent: "space-between",
}));

interface StoreProps {
  wallets: MyPointsWallet[];
}

const Store = ({ wallets }: StoreProps) => {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const handleRedeem = async (coupon: PointsCoupon) => {
    try {
      setRedeemingId(coupon.id);

      await fetcher("/api/users/me/points/redeem", {
        body: JSON.stringify({ couponId: coupon.id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      enqueueSnackbar(tAuth("points.redeemSuccess", { code: coupon.code }), {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setRedeemingId(null);

      router.refresh();
    }
  };

  const handleRedeemDialog = (coupon: PointsCoupon) =>
    setDialog({
      contentText: tAuth("points.redeemConfirm", {
        code: coupon.code,
        points: format.number(coupon.pointsCost),
      }),
      onConfirm: () => handleRedeem(coupon),
      open: true,
      title: tAuth("points.redeem"),
    });

  return (
    <>
      {wallets.length === 0 && (
        <FormCard>
          <StyledCardHeader
            title={
              <Typography color="primary" fontWeight="bold" variant="h6">
                {tAuth("store.label")}
              </Typography>
            }
          />
          <StyledCardContent>
            <Typography color="text.secondary" variant="body2">
              {tAuth("points.empty")}
            </Typography>
          </StyledCardContent>
        </FormCard>
      )}
      {wallets.map((wallet) => (
        <FormCard key={wallet.organizationSlug}>
          <StyledCardHeader
            action={
              <Typography color="primary" fontWeight="bold" variant="h5">
                {tAuth("points.points", {
                  points: format.number(wallet.balance),
                })}
              </Typography>
            }
            slotProps={{ subheader: { variant: "caption" } }}
            subheader={tAuth("points.balance")}
            title={
              <Typography color="primary" fontWeight="bold" variant="h6">
                {wallet.organizationName}
              </Typography>
            }
          />
          <StyledCardContent>
            {wallet.redeemableCoupons.length === 0 && (
              <Typography color="text.secondary" variant="body2">
                {tAuth("points.redeemableEmpty")}
              </Typography>
            )}
            {wallet.redeemableCoupons.map((coupon) => (
              <Card key={coupon.id} variant="outlined">
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
                    tAuth("points.points", {
                      points: format.number(coupon.pointsCost),
                    }),
                    coupon.validThrough &&
                      tAuth("points.validUntil", {
                        date: dayjs(coupon.validThrough)
                          .tz("Asia/Taipei")
                          .format("YYYY/MM/DD"),
                      }),
                  ]
                    .filter(Boolean)
                    .join(tCommon("middleDot"))}
                  title={coupon.code}
                />
                <StyledCardActions disableSpacing>
                  <Typography color="primary" fontWeight="bold" variant="h5">
                    {coupon.discountType === "percentage"
                      ? `-${Number(coupon.discountValue)}%`
                      : `-${coupon.discountCurrency} ${format.number(Number(coupon.discountValue))}`}
                  </Typography>
                  <Button
                    disabled={wallet.balance < coupon.pointsCost}
                    loading={redeemingId === coupon.id}
                    onClick={() => handleRedeemDialog(coupon)}
                    size="small"
                    variant="contained"
                  >
                    {tAuth("points.redeem")}
                  </Button>
                </StyledCardActions>
              </Card>
            ))}
          </StyledCardContent>
        </FormCard>
      ))}
    </>
  );
};

export default Store;
