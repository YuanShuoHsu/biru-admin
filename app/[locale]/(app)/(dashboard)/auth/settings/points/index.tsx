"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { useRouter } from "@/i18n/navigation";

import { LocalOffer } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Card,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { MyPointsWallet, PointsCoupon } from "@/types/points";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  justifyContent: "space-between",
}));

interface PointsProps {
  wallets: MyPointsWallet[];
}

const Points = ({ wallets }: PointsProps) => {
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

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

      enqueueSnackbar(
        tAuth("settings.points.redeemSuccess", { code: coupon.code }),
        { variant: "success" },
      );
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setRedeemingId(null);

      router.refresh();
    }
  };

  if (wallets.length === 0)
    return (
      <FormCard>
        <StyledCardHeader
          title={
            <Typography color="primary" fontWeight="bold" variant="h6">
              {tAuth("settings.points.label")}
            </Typography>
          }
        />
        <StyledCardContent>
          <Typography color="text.secondary" variant="body2">
            {tAuth("settings.points.empty")}
          </Typography>
        </StyledCardContent>
      </FormCard>
    );

  return (
    <>
      {wallets.map((wallet) => (
        <FormCard key={wallet.organizationSlug}>
          <StyledCardHeader
            action={
              <Typography color="primary" fontWeight="bold" variant="h5">
                {tAuth("settings.points.points", {
                  points: format.number(wallet.balance),
                })}
              </Typography>
            }
            slotProps={{ subheader: { variant: "caption" } }}
            subheader={tAuth("settings.points.balance")}
            title={
              <Typography color="primary" fontWeight="bold" variant="h6">
                {wallet.organizationName}
              </Typography>
            }
          />
          <StyledCardContent>
            {wallet.redeemableCoupons.length > 0 && (
              <Typography fontWeight="bold" variant="subtitle2">
                {tAuth("settings.points.redeemable")}
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
                    tAuth("settings.points.points", {
                      points: format.number(coupon.pointsCost),
                    }),
                    coupon.validThrough &&
                      tAuth("settings.points.validUntil", {
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
                  <Typography color="primary" fontWeight="bold" variant="h5">
                    {coupon.discountType === "percentage"
                      ? `-${Number(coupon.discountValue)}%`
                      : `-${coupon.discountCurrency} ${format.number(Number(coupon.discountValue))}`}
                  </Typography>
                  <Button
                    disabled={wallet.balance < coupon.pointsCost}
                    loading={redeemingId === coupon.id}
                    onClick={() => handleRedeem(coupon)}
                    size="small"
                    variant="contained"
                  >
                    {tAuth("settings.points.redeem")}
                  </Button>
                </StyledCardActions>
              </Card>
            ))}
            <Typography fontWeight="bold" variant="subtitle2">
              {tAuth("settings.points.transactions")}
            </Typography>
            <List dense disablePadding>
              {wallet.transactions.map((transaction) => (
                <ListItem
                  disableGutters
                  key={transaction.id}
                  secondaryAction={
                    <Typography
                      color={
                        transaction.type === "earn"
                          ? "primary"
                          : "text.secondary"
                      }
                      fontWeight="bold"
                      variant="body2"
                    >
                      {tAuth("settings.points.points", {
                        points: format.number(transaction.points, {
                          signDisplay: "exceptZero",
                        }),
                      })}
                    </Typography>
                  }
                >
                  <ListItemText
                    primary={tAuth(`settings.points.type.${transaction.type}`)}
                    secondary={[
                      format.dateTime(new Date(transaction.createdAt), "short"),
                      transaction.expiresAt &&
                        tAuth("settings.points.validUntil", {
                          date: format.dateTime(
                            new Date(transaction.expiresAt),
                            "short",
                          ),
                        }),
                    ]
                      .filter(Boolean)
                      .join(tCommon("middleDot"))}
                    slotProps={{ secondary: { variant: "caption" } }}
                  />
                </ListItem>
              ))}
            </List>
          </StyledCardContent>
        </FormCard>
      ))}
    </>
  );
};

export default Points;
