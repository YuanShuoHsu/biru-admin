"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { type UpdateUserForm, useUpdateUserFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import UploadAvatars from "@/components/UploadAvatars";

import { LocaleEnum } from "@/enums/Locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import {
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { User } from "@/types/admins";

interface UpdateUserDialogContentProps {
  mutateAdmins: () => void;
  user: User;
}

const UpdateUserDialogContent = ({
  mutateAdmins,
  user,
}: UpdateUserDialogContentProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const uploadKey = `update-user-avatar-${user.id}`;
  const image = useUploadAvatarSrc(uploadKey, user.image);

  const tAdmins = useTranslations("admins");
  const tCommon = useTranslations("common");

  const updateUserFormSchema = useUpdateUserFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateUserForm>({
    defaultValues: {
      lastName: user.lastName || undefined,
      firstName: user.firstName,
      email: user.email,
      bio: user.bio || "",
      emailSubscribed: user.emailSubscribed,
    },
    resolver: zodResolver(updateUserFormSchema),
  });

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(
      async ({ lastName, firstName, email, bio, emailSubscribed }) => {
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
              bio,
              emailSubscribed,
              image,
            },
          },
          {
            onError: ({ error: { code } }) => {
              enqueueSnackbar(getErrorMessage(code, locale), {
                variant: "error",
              });
              setDialog({ confirmLoading: false });
            },
            onRequest: () => setDialog({ confirmLoading: true }),
            onSuccess: () => {
              enqueueSnackbar(
                tAdmins("actions.updateUser.success", { email }),
                {
                  variant: "success",
                },
              );

              closeDialog();

              mutateAdmins();
            },
          },
        );
      },
    )(event);

  return (
    <FormBox id="update-user-form" onSubmit={onSubmit}>
      <UploadAvatars initialSrc={user.image} uploadKey={uploadKey} />
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
          label={`${tAdmins("actions.updateUser.lastName.label")} ${tCommon("optional")}`}
          placeholder={tAdmins("actions.updateUser.lastName.placeholder")}
          {...register("lastName")}
        />
        <TextField
          autoComplete="given-name"
          error={!!errors.firstName}
          fullWidth
          helperText={errors.firstName?.message}
          label={tAdmins("actions.updateUser.firstName.label")}
          placeholder={tAdmins("actions.updateUser.firstName.placeholder")}
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
      <TextField
        error={!!errors.bio}
        fullWidth
        helperText={errors.bio?.message}
        label={`${tAdmins("actions.updateUser.bio.label")} ${tCommon("optional")}`}
        maxRows={4}
        multiline
        placeholder={tAdmins("actions.updateUser.bio.placeholder")}
        slotProps={{ htmlInput: { maxLength: 160 } }}
        {...register("bio")}
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
    </FormBox>
  );
};

export default UpdateUserDialogContent;
