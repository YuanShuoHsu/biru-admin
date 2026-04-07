"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  type CreateUserFormInput,
  type CreateUserFormOutput,
  useCreateUserFormSchema,
} from "./definitions";

import PasswordRuleList from "@/components/PasswordRuleList";
import UploadAvatars, {
  type UploadAvatarsHandle,
} from "@/components/UploadAvatars";

import { roles } from "@/constants/admins";

import { LocaleEnum } from "@/enums/Locale";

import { usePasswordValidation } from "@/hooks/usePasswordValidation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  type BoxProps,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  handleMouseDownPassword,
  handleMouseUpPassword,
} from "@/utils/password";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface CreateUserDialogContentProps {
  fetchData: () => Promise<void>;
}

const CreateUserDialogContent = ({
  fetchData,
}: CreateUserDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const locale = useLocale();

  const tAdmins = useTranslations("admins");
  const tAuth = useTranslations("auth");

  const createUserFormSchema = useCreateUserFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateUserFormInput, unknown, CreateUserFormOutput>({
    defaultValues: {
      lastName: "",
      firstName: "",
      email: "",
      password: "",
      confirmPassword: "",
      emailSubscribed: true,
      role: "",
    },
    resolver: zodResolver(createUserFormSchema),
  });

  const uploadAvatarsRef = useRef<UploadAvatarsHandle>(null);

  const [role, password, confirmPassword] = useWatch({
    control,
    name: ["role", "password", "confirmPassword"],
  });

  const {
    passwordRules,
    confirmPasswordRules,
    isPasswordError,
    isConfirmPasswordError,
    hasPassword,
    hasConfirmPassword,
  } = usePasswordValidation(password, confirmPassword);

  const handleClickShowPassword = (key: "password" | "confirmPassword") => () =>
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(
      async ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        confirmPassword: _,
        lastName,
        firstName,
        email,
        password,
        emailSubscribed,
        role,
      }) => {
        const { avatarSrc: image } = uploadAvatarsRef.current?.getValue() || {};

        await authClient.admin.createUser(
          {
            name: (locale === LocaleEnum.En
              ? [firstName, lastName]
              : [lastName, firstName]
            )
              .filter(Boolean)
              .join(locale === LocaleEnum.En ? " " : ""),
            email,
            password,
            role,
            data: {
              firstName,
              lastName,
              image,
              emailSubscribed,
              lang: locale,
            },
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
              const message = tAdmins("actions.create.success");
              enqueueSnackbar(message, { variant: "success" });

              resetDialog();
              fetchData();
            },
          },
        );
      },
    )(event);

  return (
    <StyledBox component="form" id="create-user-form" onSubmit={onSubmit}>
      <UploadAvatars ref={uploadAvatarsRef} />
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
          label={tAdmins("actions.create.lastName.label")}
          placeholder={tAdmins("actions.create.lastName.placeholder")}
          {...register("lastName")}
        />
        <TextField
          autoComplete="given-name"
          error={!!errors.firstName}
          fullWidth
          helperText={errors.firstName?.message}
          label={tAdmins("actions.create.firstName.label")}
          placeholder={tAdmins("actions.create.firstName.placeholder")}
          required
          {...register("firstName")}
        />
      </Stack>
      <TextField
        autoComplete="email"
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={tAdmins("actions.create.email.label")}
        placeholder={tAdmins("actions.create.email.placeholder")}
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
        label={tAdmins("actions.create.password.label")}
        placeholder={tAdmins("actions.create.password.placeholder")}
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
        label={tAdmins("actions.create.confirmPassword.label")}
        placeholder={tAdmins("actions.create.confirmPassword.placeholder")}
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
              {tAdmins("actions.create.emailSubscribed")}
            </Typography>
          }
        />
      </Stack>
      <TextField
        error={!!errors.role}
        fullWidth
        helperText={errors.role?.message}
        label={tAdmins("role.label")}
        required
        select
        value={role}
        {...register("role")}
      >
        <MenuItem disabled value="">
          <em>{tAdmins("role.placeholder")}</em>
        </MenuItem>
        {roles.map((role) => (
          <MenuItem key={role} value={role}>
            {tAdmins(`role.${role}`)}
          </MenuItem>
        ))}
      </TextField>
    </StyledBox>
  );
};

export default CreateUserDialogContent;
