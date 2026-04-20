"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect } from "react";
import { useForm } from "react-hook-form";

import { type ProfileForm, useProfileFormSchema } from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import UploadAvatars, { useUploadAvatarSrc } from "@/components/UploadAvatars";

import { LocaleEnum } from "@/enums/Locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Button, Stack, TextField, Typography } from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

const PROFILE_UPLOAD_AVATAR_KEY = "profile-upload-avatar";

const Profile = () => {
  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const profileFormSchema = useProfileFormSchema();

  const {
    formState: { errors, isDirty: isNameDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileForm>({
    defaultValues: {
      lastName: session?.user.lastName || "",
      firstName: session?.user.firstName || "",
    },
    resolver: zodResolver(profileFormSchema),
  });

  useEffect(() => {
    reset({
      lastName: session?.user.lastName || "",
      firstName: session?.user.firstName || "",
    });
  }, [reset, session?.user.firstName, session?.user.lastName]);

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");

  const avatarSrc = useUploadAvatarSrc(
    PROFILE_UPLOAD_AVATAR_KEY,
    session?.user.image,
  );
  const isAvatarDirty = avatarSrc !== (session?.user.image || undefined);

  const updateProfile = async ({ lastName, firstName }: ProfileForm) => {
    const name = (
      locale === LocaleEnum.En ? [firstName, lastName] : [lastName, firstName]
    )
      .filter(Boolean)
      .join(locale === LocaleEnum.En ? " " : "");

    await authClient.updateUser({
      lastName,
      firstName,
      name,
      image: avatarSrc,
      fetchOptions: {
        onError: ({ error }) => {
          enqueueSnackbar(getErrorMessage(error.code, locale), {
            variant: "error",
          });
        },
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          enqueueSnackbar(tAuth("settings.profile.saveSuccess"), {
            variant: "success",
          });
        },
      },
    });
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit((data: ProfileForm) => {
      setDialog({
        contentText: tAuth("settings.profile.confirmContentText"),
        onConfirm: () => updateProfile(data),
        open: true,
        title: tAuth("settings.profile.label"),
      });
    })(event);

  return (
    <FormCard component="form" onSubmit={onSubmit}>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.profile.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        <UploadAvatars
          initialSrc={session?.user.image}
          key={session?.user.id}
          uploadKey={PROFILE_UPLOAD_AVATAR_KEY}
        />
        <Stack
          width="100%"
          direction={locale === LocaleEnum.En ? "row-reverse" : "row"}
          spacing={2}
        >
          <TextField
            autoComplete="family-name"
            error={!!errors.lastName}
            fullWidth
            helperText={errors.lastName?.message}
            label={tAuth("lastName.label")}
            placeholder={tAuth("lastName.placeholder")}
            {...register("lastName")}
          />
          <TextField
            autoComplete="given-name"
            error={!!errors.firstName}
            fullWidth
            helperText={errors.firstName?.message}
            label={tAuth("firstName.label")}
            placeholder={tAuth("firstName.placeholder")}
            required
            {...register("firstName")}
          />
        </Stack>
      </StyledCardContent>
      <StyledCardActions disableSpacing sx={{ alignItems: "flex-end" }}>
        <Button
          disabled={!isNameDirty && !isAvatarDirty}
          loading={isSubmitting}
          size="small"
          type="submit"
          variant="contained"
        >
          {tAuth("settings.saveChanges")}
        </Button>
      </StyledCardActions>
    </FormCard>
  );
};

export default Profile;
