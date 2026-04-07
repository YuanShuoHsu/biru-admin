"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { type EditUserFormValues, useEditUserFormSchema } from "./definitions";

import UploadAvatars, {
  type UploadAvatarsHandle,
} from "@/components/UploadAvatars";

import { LocaleEnum } from "@/enums/Locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  Box,
  type BoxProps,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminUser } from "@/types/admins";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface EditUserDialogContentProps {
  fetchData: () => void;
  user: AdminUser;
}

const EditUserDialogContent = ({
  fetchData,
  user,
}: EditUserDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const uploadAvatarsRef = useRef<UploadAvatarsHandle>(null);

  const tAdmins = useTranslations("admins");

  const editUserFormSchema = useEditUserFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<EditUserFormValues>({
    defaultValues: {
      lastName: user.lastName,
      firstName: user.firstName,
      email: user.email,
      emailSubscribed: user.emailSubscribed,
    },
    resolver: zodResolver(editUserFormSchema),
  });

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(async ({ lastName, firstName, email, emailSubscribed }) => {
      const { avatarSrc: image } = uploadAvatarsRef.current?.getValue() || {};

      await authClient.admin.updateUser(
        {
          userId: user.id,
          data: {
            name: (locale === LocaleEnum.En
              ? [firstName, lastName]
              : [lastName, firstName]
            )
              .filter(Boolean)
              .join(locale === LocaleEnum.En ? " " : ""),
            email,
            firstName,
            lastName,
            emailSubscribed,
            ...(image !== undefined && { image }),
          },
        },
        {
          onRequest: () => setDialog({ confirmLoading: true }),
          onError: ({ error: { code } }) => {
            console.log(code);
            enqueueSnackbar(getErrorMessage(code, locale), {
              variant: "error",
            });
            setDialog({ confirmLoading: false });
          },
          onSuccess: () => {
            enqueueSnackbar(tAdmins("actions.edit.success"), {
              variant: "success",
            });

            resetDialog();
            fetchData();
          },
        },
      );
    })(event);

  return (
    <StyledBox component="form" id="edit-user-form" onSubmit={onSubmit}>
      <UploadAvatars initialSrc={user.image} ref={uploadAvatarsRef} />
      <Stack
        width="100%"
        direction={locale === LocaleEnum.En ? "row-reverse" : "row"}
        gap={2}
      >
        <TextField
          autoComplete="family-name"
          error={!!errors.lastName}
          fullWidth
          helperText={errors.lastName?.message}
          label={tAdmins("actions.edit.lastName.label")}
          placeholder={tAdmins("actions.edit.lastName.placeholder")}
          {...register("lastName")}
        />
        <TextField
          autoComplete="given-name"
          error={!!errors.firstName}
          fullWidth
          helperText={errors.firstName?.message}
          label={tAdmins("actions.edit.firstName.label")}
          placeholder={tAdmins("actions.edit.firstName.placeholder")}
          required
          {...register("firstName")}
        />
      </Stack>
      <TextField
        autoComplete="email"
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={tAdmins("email.label")}
        placeholder={tAdmins("email.placeholder")}
        required
        type="email"
        {...register("email")}
      />
      <Stack width="100%" flexDirection="row" alignItems="center">
        <FormControlLabel
          control={
            <Controller
              control={control}
              name="emailSubscribed"
              render={({ field: { onChange, value } }) => (
                <Checkbox checked={value} onChange={onChange} size="small" />
              )}
            />
          }
          label={
            <Typography variant="body2">
              {tAdmins("emailSubscribed.checkbox")}
            </Typography>
          }
        />
      </Stack>
    </StyledBox>
  );
};

export default EditUserDialogContent;
