"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  BAN_EXPIRES_OPTIONS,
  type BanUserFormInput,
  type BanUserFormOutput,
  useBanUserFormSchema,
} from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, MenuItem, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface BanUserDialogContentProps {
  fetchData: () => void;
  user: UserWithRole;
}

const BanUserDialogContent = ({
  fetchData,
  user,
}: BanUserDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tAdmins = useTranslations("admins");

  const banUserFormSchema = useBanUserFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<BanUserFormInput, unknown, BanUserFormOutput>({
    defaultValues: { email: user.email, banExpiresIn: 0, banReason: "" },
    resolver: zodResolver(banUserFormSchema),
  });

  const banExpiresIn = useWatch({ control, name: "banExpiresIn" });

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(async ({ banExpiresIn, banReason }) => {
      await authClient.admin.banUser(
        {
          ...(banExpiresIn > 0 && { banExpiresIn }),
          ...(banReason && { banReason }),
          userId: user.id,
        },
        {
          onRequest: () => {
            setDialog({ confirmLoading: true });
          },
          onError: ({ error: { code } }) => {
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });

            setDialog({ confirmLoading: false });
          },
          onSuccess: () => {
            const message = tAdmins("actions.banUser.success");
            enqueueSnackbar(message, { variant: "success" });

            resetDialog();
            fetchData();
          },
        },
      );
    })(event);

  return (
    <StyledBox component="form" id="ban-user-form" onSubmit={onSubmit}>
      <TextField
        autoComplete="email"
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={tAdmins("email.label")}
        placeholder={tAdmins("email.placeholder")}
        required
        slotProps={{ input: { readOnly: true } }}
        type="email"
        {...register("email")}
      />
      <TextField
        error={!!errors.banReason}
        fullWidth
        helperText={errors.banReason?.message}
        label={tAdmins("actions.banUser.banReason.label")}
        multiline
        placeholder={tAdmins("actions.banUser.banReason.placeholder")}
        {...register("banReason")}
      />
      <TextField
        error={!!errors.banExpiresIn}
        fullWidth
        helperText={errors.banExpiresIn?.message}
        label={tAdmins("actions.banUser.banExpiresIn.label")}
        select
        value={banExpiresIn}
        {...register("banExpiresIn")}
      >
        <MenuItem disabled value="">
          <em>{tAdmins("actions.banUser.banExpiresIn.placeholder")}</em>
        </MenuItem>
        {BAN_EXPIRES_OPTIONS.map(({ value, label }) => (
          <MenuItem key={value} value={value}>
            {tAdmins(`actions.banUser.banExpiresIn.options.${label}`)}
          </MenuItem>
        ))}
      </TextField>
    </StyledBox>
  );
};

export default BanUserDialogContent;
