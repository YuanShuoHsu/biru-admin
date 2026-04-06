"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

  const tAdminsUsers = useTranslations("admins.users");

  const banUserFormSchema = useBanUserFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<BanUserFormInput, unknown, BanUserFormOutput>({
    defaultValues: { banExpiresIn: 0, banReason: "" },
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
            const message = tAdminsUsers("ban.success");
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
        defaultValue={user.email}
        fullWidth
        label={tAdminsUsers("columns.email")}
        slotProps={{ input: { readOnly: true } }}
        type="email"
      />
      <TextField
        error={!!errors.banReason}
        fullWidth
        helperText={errors.banReason?.message}
        label={tAdminsUsers("ban.fields.banReason.label")}
        multiline
        placeholder={tAdminsUsers("ban.fields.banReason.placeholder")}
        {...register("banReason")}
      />
      <TextField
        error={!!errors.banExpiresIn}
        fullWidth
        helperText={errors.banExpiresIn?.message}
        label={tAdminsUsers("ban.fields.banExpiresIn.label")}
        select
        value={banExpiresIn}
        {...register("banExpiresIn")}
      >
        <MenuItem disabled value="">
          <em>{tAdminsUsers("ban.fields.banExpiresIn.placeholder")}</em>
        </MenuItem>
        {BAN_EXPIRES_OPTIONS.map(({ value, label }) => (
          <MenuItem key={value} value={value}>
            {tAdminsUsers(`ban.fields.banExpiresIn.options.${label}`)}
          </MenuItem>
        ))}
      </TextField>
    </StyledBox>
  );
};

export default BanUserDialogContent;
