"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import FormBox from "@/components/FormBox";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Coupon } from "@/types/coupons";

import { getCouponsPath } from "@/utils/coupons";
import { fetcher } from "@/utils/fetcher";
import { getErrorMessage } from "@/utils/errors";

interface GrantCouponDialogProps {
  coupon: Coupon;
  organizationSlug?: string;
}

const GrantCouponDialog = ({
  coupon,
  organizationSlug,
}: GrantCouponDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCoupons = useTranslations("coupons");

  const grantFormSchema = z.object({
    email: z.email({ error: tCoupons("actions.grantCoupon.email.invalid") }),
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<z.infer<typeof grantFormSchema>>({
    defaultValues: { email: "" },
    resolver: zodResolver(grantFormSchema),
  });

  const onSubmitHandler = async ({ email }: { email: string }) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`${getCouponsPath(organizationSlug)}/${coupon.id}/grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      enqueueSnackbar(
        tCoupons("actions.grantCoupon.success", { code: coupon.code, email }),
        { variant: "success" },
      );

      closeDialog();
    } catch (error) {
      enqueueSnackbar(
        getErrorMessage(error) || tCoupons("actions.grantCoupon.error"),
        { variant: "error" },
      );

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="grant-coupon-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.email}
        fullWidth
        helperText={
          errors.email?.message || tCoupons("actions.grantCoupon.email.hint")
        }
        label={tCoupons("actions.grantCoupon.email.label")}
        placeholder={tCoupons("actions.grantCoupon.email.placeholder")}
        required
        type="email"
        {...register("email")}
      />
    </FormBox>
  );
};

export default GrantCouponDialog;
