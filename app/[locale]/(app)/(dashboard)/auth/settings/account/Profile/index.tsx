"use client";

import dayjs from "dayjs";
import { type CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";
import { useLocale, useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type ProfileForm, useProfileFormSchema } from "./definitions";

import CountryAutocomplete from "@/components/CountryAutocomplete";
import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import TextMaskCustom from "@/components/TextMaskCustom";
import UploadAvatars from "@/components/UploadAvatars";

import { LocaleEnum } from "@/enums/Locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";
import { useSession } from "@/hooks/useSession";

import { authClient } from "@/lib/auth-client";

import {
  Button,
  CardActions,
  Checkbox,
  DialogContentText,
  FormControlLabel,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import { formatFullName } from "@/utils/auth";
import { getPhoneDefaults, getPhoneFormatting } from "@/utils/countries";

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const StyledStack = styled(Stack)({
  width: "100%",
});

const StyledGrid = styled(Grid)({
  width: "100%",
});

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingTop: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: theme.spacing(2),
}));

const PROFILE_UPLOAD_AVATAR_KEY = "profile-upload-avatar";

const toBirthDateValue = (value: Date | string | null | undefined): string =>
  value ? dayjs(value).format("YYYY-MM-DD") : "";

const Profile = () => {
  const session = useSession();
  const { setSession } = useAuthStore((state) => state);
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
      emailSubscribed: session?.user.emailSubscribed ?? true,
    },
    resolver: zodResolver(profileFormSchema),
  });

  const [birthDate, countryCode, telephone, emailSubscribed] = useWatch({
    control,
    name: ["birthDate", "countryCode", "telephone", "emailSubscribed"],
  });

  const { mask, placeholder } = getPhoneFormatting(countryCode);

  useEffect(() => {
    reset({
      lastName: session?.user.lastName || "",
      firstName: session?.user.firstName || "",
      bio: session?.user.bio || "",
      birthDate: toBirthDateValue(session?.user.birthDate),
      ...getPhoneDefaults(session?.user.phoneNumber, locale),
      emailSubscribed: session?.user.emailSubscribed ?? true,
    });
  }, [
    locale,
    reset,
    session?.user.bio,
    session?.user.birthDate,
    session?.user.emailSubscribed,
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
  const isAvatarDirty = avatarSrc !== (session?.user.image || null);

  const updateProfile = async ({
    lastName,
    firstName,
    bio,
    birthDate: birthDateValue,
    countryCode: countryCodeValue,
    telephone: telephoneValue,
    emailSubscribed: emailSubscribedValue,
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
      emailSubscribed: emailSubscribedValue,
      fetchOptions: {
        onError: ({ error: { message } }) => {
          enqueueSnackbar(message, {
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
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tAuth.rich("settings.profile.confirmContentText", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  email: session?.user.email || "",
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
        onConfirm: () => updateProfile(data),
        open: true,
        title: tAuth("settings.profile.label"),
      });
    })(event);

  return (
    <FormCard component="form" onSubmit={onSubmit}>
      <StyledCardHeader
        title={
          <StyledTypography color="primary" variant="h6">
            {tAuth("settings.profile.label")}
          </StyledTypography>
        }
      />
      <StyledCardContent>
        <UploadAvatars
          initialSrc={session?.user.image}
          key={session?.user.id}
          uploadKey={PROFILE_UPLOAD_AVATAR_KEY}
        />
        <StyledStack
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
        </StyledStack>
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
        <StyledGrid container spacing={2}>
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
        </StyledGrid>
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
        <FormControlLabel
          control={
            <Checkbox
              checked={emailSubscribed}
              size="small"
              {...register("emailSubscribed")}
            />
          }
          label={tAuth("emailUpdates")}
          slotProps={{ typography: { variant: "body2" } }}
        />
      </StyledCardContent>
      <StyledCardActions disableSpacing>
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
