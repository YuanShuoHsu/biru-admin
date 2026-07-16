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

import { LocalOffer, Stars } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Card,
  CardActions,
  Chip,
  DialogContentText,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
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

  const coupons = wallets.flatMap((wallet) =>
    wallet.redeemableCoupons.map((coupon) => ({
      ...coupon,
      balance: wallet.balance,
      organizationName: wallet.organizationName,
    })),
  );

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
      content: (
        <DialogContentText>
          {tAuth.rich("points.redeemConfirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            code: coupon.code,
            points: format.number(coupon.pointsCost),
          })}
        </DialogContentText>
      ),
      onConfirm: () => handleRedeem(coupon),
      open: true,
      title: tAuth("points.redeem"),
    });

  return (
    <FormCard>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("store.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        {wallets.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {tAuth("points.empty")}
          </Typography>
        )}
        {wallets.length > 0 && (
          <List disablePadding>
            {wallets.map((wallet) => (
              <ListItem
                disableGutters
                key={wallet.organizationSlug}
                secondaryAction={
                  <Typography color="primary" fontWeight="bold" variant="h5">
                    {tAuth("points.points", {
                      points: format.number(wallet.balance),
                    })}
                  </Typography>
                }
              >
                <ListItemAvatar>
                  <StyledAvatar>
                    <Stars fontSize="small" />
                  </StyledAvatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    wallets.length > 1
                      ? wallet.organizationName
                      : tAuth("points.balance")
                  }
                  secondary={
                    wallets.length > 1 ? tAuth("points.balance") : null
                  }
                  slotProps={{
                    primary: { fontWeight: "bold", variant: "subtitle2" },
                    secondary: { variant: "caption" },
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
        {wallets.length > 0 && coupons.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {tAuth("points.redeemableEmpty")}
          </Typography>
        )}
        {coupons.map((coupon) => (
          <Card key={coupon.id} variant="outlined">
            <StyledCardHeader
              action={
                <Chip
                  color="primary"
                  label={
                    coupon.discountType === "percentage"
                      ? `-${Number(coupon.discountValue)}%`
                      : `-${coupon.discountCurrency} ${format.number(Number(coupon.discountValue))}`
                  }
                  size="small"
                />
              }
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
                wallets.length > 1 && coupon.organizationName,
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
                {tAuth("points.points", {
                  points: format.number(coupon.pointsCost),
                })}
              </Typography>
              <Button
                disabled={coupon.balance < coupon.pointsCost}
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
  );
};

export default Store;
