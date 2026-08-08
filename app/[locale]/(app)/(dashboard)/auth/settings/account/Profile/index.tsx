"use client";

import dayjs from "dayjs";
import { type CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";
import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type ProfileForm, useProfileFormSchema } from "./definitions";

import CountryAutocomplete from "@/components/CountryAutocomplete";
import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import TextMaskCustom from "@/components/TextMaskCustom";
import UploadAvatars from "@/components/UploadAvatars";

import { LocaleEnum } from "@/enums/Locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Button, Grid, Stack, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import { formatFullName } from "@/utils/auth";
import { getPhoneDefaults, getPhoneFormatting } from "@/utils/countries";

const PROFILE_UPLOAD_AVATAR_KEY = "profile-upload-avatar";

const toBirthDateValue = (value: Date | string | null | undefined): string =>
  value ? dayjs(value).format("YYYY-MM-DD") : "";

const Profile = () => {
  const { session, setSession } = useAuthStore((state) => state);
  const { setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const profileFormSchema = useProfileFormSchema();

  const {
    control,
    formState: { errors, isDirty: isNameDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ProfileForm>({
    defaultValues: {
      lastName: session?.user.lastName || "",
      firstName: session?.user.firstName || "",
      bio: session?.user.bio || "",
      birthDate: toBirthDateValue(session?.user.birthDate),
      ...getPhoneDefaults(session?.user.phoneNumber, locale),
    },
    resolver: zodResolver(profileFormSchema),
  });

  const [birthDate, countryCode, telephone] = useWatch({
    control,
    name: ["birthDate", "countryCode", "telephone"],
  });

  const { mask, placeholder } = getPhoneFormatting(countryCode);

  useEffect(() => {
    reset({
      lastName: session?.user.lastName || "",
      firstName: session?.user.firstName || "",
      bio: session?.user.bio || "",
      birthDate: toBirthDateValue(session?.user.birthDate),
      ...getPhoneDefaults(session?.user.phoneNumber, locale),
    });
  }, [
    locale,
    reset,
    session?.user.bio,
    session?.user.birthDate,
    session?.user.firstName,
    session?.user.lastName,
    session?.user.phoneNumber,
  ]);

  const { enqueueSnackbar } = useSnackbar();

  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");

  const avatarSrc = useUploadAvatarSrc(
    PROFILE_UPLOAD_AVATAR_KEY,
    session?.user.image,
  );
  const isAvatarDirty = avatarSrc !== (session?.user.image || undefined);

  const updateProfile = async ({
    lastName,
    firstName,
    bio,
    birthDate: birthDateValue,
    countryCode: countryCodeValue,
    telephone: telephoneValue,
  }: ProfileForm) => {
    const name = formatFullName(locale, firstName, lastName);

    await authClient.updateUser({
      image: avatarSrc,
      lastName,
      firstName,
      name,
      bio,
      ...(birthDateValue && { birthDate: new Date(birthDateValue) }),
      phoneNumber: telephoneValue
        ? parsePhoneNumberWithError(
            telephoneValue,
            countryCodeValue as CountryCode,
          ).number
        : "",
      fetchOptions: {
        onError: ({ error }) => {
          enqueueSnackbar(getErrorMessage(error.code, locale), {
            variant: "error",
          });
        },
        onSuccess: async () => {
          const { data } = await authClient.getSession();
          setSession(data);

          enqueueSnackbar(tAuth("settings.profile.success", { name }), {
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
            label={`${tAuth("lastName.label")} ${tCommon("optional")}`}
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
        <DatePicker
          disableFuture
          label={`${tAuth("birthDate.label")} ${tCommon("optional")}`}
          slotProps={{
            textField: {
              fullWidth: true,
              helperText: tAuth("birthDate.hint"),
            },
          }}
          value={birthDate ? dayjs(birthDate) : null}
          onChange={(date) =>
            setValue("birthDate", date ? date.format("YYYY-MM-DD") : "", {
              shouldDirty: true,
            })
          }
        />
        <Grid container spacing={2} width="100%">
          <Grid size={{ xs: 12, sm: 6 }}>
            <CountryAutocomplete
              error={!!errors.countryCode}
              helperText={errors.countryCode?.message}
              label={tAuth("countryCode.label")}
              mode="country"
              placeholder={tAuth("countryCode.placeholder")}
              required
              value={countryCode}
              {...register("countryCode")}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              autoComplete="tel"
              error={!!errors.telephone}
              fullWidth
              helperText={errors.telephone?.message}
              label={`${tAuth("telephone.label")} ${tCommon("optional")}`}
              slotProps={{
                input: {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  inputComponent: TextMaskCustom as any,
                  inputProps: { mask, placeholder },
                },
              }}
              type="tel"
              value={telephone}
              {...register("telephone")}
            />
          </Grid>
        </Grid>
        <TextField
          error={!!errors.bio}
          fullWidth
          helperText={errors.bio?.message}
          label={`${tAuth("bio.label")} ${tCommon("optional")}`}
          maxRows={4}
          multiline
          placeholder={tAuth("bio.placeholder")}
          slotProps={{ htmlInput: { maxLength: 160 } }}
          {...register("bio")}
        />
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
