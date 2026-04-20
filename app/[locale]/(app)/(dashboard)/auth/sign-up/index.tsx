// https://nextjs.org/docs/app/guides/authentication
// https://mui.com/toolpad/core/react-sign-up-page/
// https://mui.com/store/sign-up/
// https://mui.com/x/react-date-pickers/quickstart/
// https://mui.com/x/react-date-pickers/validation/

"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, type ReactNode, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { type SignUpForm, useSignUpFormSchema } from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import GoogleButton from "@/components/GoogleButton";
import PasswordRuleList from "@/components/PasswordRuleList";
import UploadAvatars from "@/components/UploadAvatars";

import { LegalLinkType } from "@/constants/legal";
import { query } from "@/constants/query";

import { LocaleEnum } from "@/enums/Locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { usePasswordValidation } from "@/hooks/usePasswordValidation";

import { useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCountdownStore } from "@/providers/countdown-store-provider";

import { useUploadAvatarStore } from "@/providers/upload-avatar-store-provider";

import { getHref } from "@/utils/href";
import {
  handleMouseDownPassword,
  handleMouseUpPassword,
} from "@/utils/password";

const StyledTypography = styled(Typography)({
  whiteSpace: "pre-line",
});

// const today = dayjs();

const SIGN_UP_AVATAR_KEY = "sign-up-avatar";

interface AuthSignUpProps {
  locale: Locale;
  redirectTo?: string;
}

const AuthSignUp = ({ locale, redirectTo }: AuthSignUpProps) => {
  // const defaultCountry = getDefaultCountry(locale);

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  // const [isGenderFocused, setIsGenderFocused] = useState(false);

  const { startCountdown } = useCountdownStore((state) => state);

  const signInHref = getHref("/auth/sign-in", {
    [query.redirectTo]: redirectTo,
  });

  const signUpFormSchema = useSignUpFormSchema();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SignUpForm>({
    defaultValues: {
      lastName: "",
      firstName: "",
      // birthDate: "",
      // gender: "",
      email: "",
      password: "",
      confirmPassword: "",
      // country: defaultCountry,
      // phoneNumber: "",
      emailSubscribed: true,
    },
    resolver: zodResolver(signUpFormSchema),
  });

  const { avatarSrcs } = useUploadAvatarStore((state) => state);
  const avatarSrc = avatarSrcs[SIGN_UP_AVATAR_KEY];

  const router = useRouter();

  const tAuth = useTranslations("auth");

  // const genderOptions = GENDER_VALUES.map((value) => ({
  //   label: tAuth("gender.options")[GENDER_LABELS[value]],
  //   value,
  // }));

  const [password, confirmPassword] = useWatch({
    control,
    name: ["password", "confirmPassword"],
  });
  // const country = watch("country");

  const {
    passwordRules,
    confirmPasswordRules,
    isPasswordError,
    isConfirmPasswordError,
    hasPassword,
    hasConfirmPassword,
  } = usePasswordValidation(password, confirmPassword);

  const renderLegalLink = (chunks: ReactNode, type: LegalLinkType) => {
    const legalHref = getHref(`/company/${type}`, {
      [query.back]: "/auth/sign-up",
      [query.redirectTo]: redirectTo,
    });

    return (
      <Link href={legalHref} key={type} underline="hover">
        {chunks}
      </Link>
    );
  };

  // const handleBirthDateChange =
  //   (onChange: (value: string) => void) => (newValue: Dayjs | null) => {
  //     onChange(newValue?.isValid() ? newValue.format("YYYY-MM-DD") : "");
  //   };

  // const handleGenderFocus = () => setIsGenderFocused(true);
  // const handleGenderBlur = () => setIsGenderFocused(false);

  const handleClickShowPassword = (key: "password" | "confirmPassword") => () =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const onSubmitHandler = async ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    confirmPassword: _,
    // country: { code },
    // phoneNumber,
    email,
    emailSubscribed,
    firstName,
    lastName,
    password,
  }: SignUpForm) => {
    const name = (
      locale === LocaleEnum.En ? [firstName, lastName] : [lastName, firstName]
    )
      .filter(Boolean)
      .join(locale === LocaleEnum.En ? " " : "");
    // const parsedPhoneNumber = parsePhoneNumberWithError(phoneNumber, code);

    await authClient.signUp.email(
      {
        // birthDate,
        callbackURL: redirectTo,
        email,
        emailSubscribed,
        firstName,
        // gender,
        image: avatarSrc,
        lang: locale,
        lastName,
        name,
        password,
        // phoneNumber,
      },
      {
        headers: { "Accept-Language": locale },
        onError: ({ error: { code } }) => {
          enqueueSnackbar(getErrorMessage(code, locale), {
            variant: "error",
          });
        },
        onSuccess: () => {
          startCountdown("verify-email");

          router.push({
            pathname: "/auth/verify-email",
            query: {
              [query.email]: email,
              [query.redirectTo]: redirectTo,
            },
          });
        },
      },
    );
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormCard component="form" onSubmit={onSubmit}>
      <StyledCardHeader
        title={
          <Typography
            color="primary"
            fontWeight="bold"
            textAlign="center"
            variant="h6"
          >
            {tAuth("signUp.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        <GoogleButton action="signUp" redirectTo={redirectTo} />
        <Divider flexItem>{tAuth("or")}</Divider>
        <UploadAvatars uploadKey={SIGN_UP_AVATAR_KEY} />
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
        {/* <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <DatePicker
              disableFuture
              label={tAuth("birthDate.label")}
              maxDate={today}
              onChange={handleBirthDateChange(onChange)}
              openTo="year"
              slotProps={{
                textField: {
                  autoComplete: "bday",
                  error: !!error,
                  fullWidth: true,
                  helperText: error?.message,
                  placeholder: tAuth("birthDate.placeholder"),
                  required: true,
                },
              }}
              value={value ? dayjs(value) : null}
              views={["year", "month", "day"]}
              yearsOrder="desc"
            />
          )}
        /> */}
        {/* Incorrect use of <label for=FORM_ELEMENT> */}
        {/* <TextField
          autoComplete="sex"
          defaultValue=""
          error={!!errors.gender}
          fullWidth
          label={tAuth("gender.label")}
          helperText={errors.gender?.message}
          onFocus={handleGenderFocus}
          required
          select
          slotProps={{
            select: {
              displayEmpty: isGenderFocused,
              renderValue: (value: unknown) => {
                if (!value)
                  return (
                    <Typography color="gray">
                      {tAuth("gender.placeholder")}
                    </Typography>
                  );

                return genderOptions.find(
                  ({ value: optionValue }) => optionValue === value,
                )?.label;
              },
            },
          }}
          {...register("gender", {
            onBlur: handleGenderBlur,
          })}
        >
          {genderOptions.map(({ label, value }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField> */}
        <TextField
          autoComplete="email"
          error={!!errors.email}
          fullWidth
          helperText={errors.email?.message}
          label={tAuth("email.label")}
          placeholder={tAuth("email.placeholder")}
          required
          type="email"
          {...register("email")}
        />
        <TextField
          autoComplete="new-password"
          error={isPasswordError}
          fullWidth
          helperText={
            <PasswordRuleList hasValue={hasPassword} rules={passwordRules} />
          }
          label={tAuth("password.label")}
          placeholder={tAuth("password.placeholder")}
          required
          slotProps={{
            formHelperText: { component: "div" },
            input: {
              endAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    aria-label={
                      showPassword.password
                        ? tAuth("hidePassword")
                        : tAuth("showPassword")
                    }
                    onClick={handleClickShowPassword("password")}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                  >
                    {showPassword.password ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          type={showPassword.password ? "text" : "password"}
          {...register("password")}
        />
        <TextField
          autoComplete="new-password"
          error={isConfirmPasswordError}
          fullWidth
          helperText={
            <PasswordRuleList
              hasValue={hasConfirmPassword}
              rules={confirmPasswordRules}
            />
          }
          label={tAuth("confirmPassword.label")}
          placeholder={tAuth("confirmPassword.placeholder")}
          required
          slotProps={{
            formHelperText: { component: "div" },
            input: {
              endAdornment: (
                <InputAdornment position="start">
                  <IconButton
                    aria-label={
                      showPassword.confirmPassword
                        ? tAuth("hidePassword")
                        : tAuth("showPassword")
                    }
                    onClick={handleClickShowPassword("confirmPassword")}
                    onMouseDown={handleMouseDownPassword}
                    onMouseUp={handleMouseUpPassword}
                    edge="end"
                  >
                    {showPassword.confirmPassword ? (
                      <VisibilityOff />
                    ) : (
                      <Visibility />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          type={showPassword.confirmPassword ? "text" : "password"}
          {...register("confirmPassword")}
        />
        {/* <Grid width="100%" container spacing={2}>
          <Grid size={{ xs: 6, sm: 4 }}>
            <Controller
              control={control}
              name="country"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <CountrySelect
                  error={!!error}
                  helperText={error?.message}
                  onChange={onChange}
                  value={value}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 8 }}>
            <Controller
              control={control}
              name="phoneNumber"
              render={({
                field: { onChange, value },
                fieldState: { error },
              }) => (
                <TextField
                  autoComplete="tel"
                  error={!!error}
                  fullWidth
                  helperText={error?.message}
                  label={tAuth("phone")}
                  onChange={onChange}
                  required
                  slotProps={{
                    input: {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      inputComponent: TextMaskCustom as any,
                      inputProps: { countryCode: country.code },
                    },
                  }}
                  type="tel"
                  value={value}
                />
              )}
            />
          </Grid>
        </Grid> */}
        <Stack
          width="100%"
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
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
              <Typography variant="body2">{tAuth("emailUpdates")}</Typography>
            }
          />
        </Stack>
      </StyledCardContent>
      <StyledCardActions disableSpacing>
        <Button
          fullWidth
          loading={isSubmitting}
          loadingPosition="end"
          size="large"
          type="submit"
          variant="contained"
        >
          {tAuth("signUp.label")}
        </Button>
        <StyledTypography
          align="center"
          color="text.secondary"
          variant="caption"
        >
          {tAuth.rich("legalConsent", {
            action: tAuth("signUp.label"),
            terms: (chunks) => renderLegalLink(chunks, LegalLinkType.Terms),
            privacy: (chunks) => renderLegalLink(chunks, LegalLinkType.Privacy),
          })}
        </StyledTypography>
        <Divider flexItem />
        <Stack flexDirection="row" alignItems="center" gap={0.5}>
          <Typography variant="body2">{tAuth("hasAccount")}</Typography>
          <Link href={signInHref} underline="hover" variant="body2">
            {tAuth("signIn.label")}
          </Link>
        </Stack>
      </StyledCardActions>
    </FormCard>
  );
};

export default AuthSignUp;
