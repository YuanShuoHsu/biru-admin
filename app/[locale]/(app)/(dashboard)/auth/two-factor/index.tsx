"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  TWO_FACTOR_METHOD,
  type TwoFactorForm,
  type TwoFactorMethod,
  useTwoFactorFormSchema,
} from "./definitions";

import FormCard, {
  StyledCardActions,
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { query } from "@/constants/query";
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  NO_ADMIN_ACCESS_ROUTE,
} from "@/constants/route";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useCountdownStore } from "@/providers/countdown-store-provider";

import { getHref } from "@/utils/href";

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const SwitchMethodStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
}));

const CODE_METHODS: TwoFactorMethod[] = [
  TWO_FACTOR_METHOD.TOTP,
  TWO_FACTOR_METHOD.OTP,
];

interface AuthTwoFactorProps {
  methods: string[];
  redirectTo?: string;
}

const AuthTwoFactor = ({ methods, redirectTo }: AuthTwoFactorProps) => {
  const availableMethods = [
    ...CODE_METHODS.filter(
      (method) => !methods.length || methods.includes(method),
    ),
    TWO_FACTOR_METHOD.BACKUP_CODE,
  ];

  const [method, setMethod] = useState(availableMethods[0]);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const { setSession } = useAuthStore((state) => state);

  const { items, startCountdown } = useCountdownStore((state) => state);
  const countdown = items["two-factor-otp"];
  const isCountingDown = countdown > 0;

  const twoFactorFormSchema = useTwoFactorFormSchema(method);

  const {
    clearErrors,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<TwoFactorForm>({
    defaultValues: { code: "", trustDevice: false },
    resolver: zodResolver(twoFactorFormSchema),
  });

  const trustDevice = useWatch({ control, name: "trustDevice" });

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const sendOtp = tAuth("twoFactor.otp.actions");

  const signInHref = getHref("/auth/sign-in", {
    [query.redirectTo]: redirectTo,
  });

  const isBackupCode = method === TWO_FACTOR_METHOD.BACKUP_CODE;

  const handleMethodChange = (nextMethod: TwoFactorMethod) => () => {
    clearErrors();
    setValue("code", "");
    setMethod(nextMethod);
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);

    await authClient.twoFactor.sendOtp(undefined, {
      onError: ({ error: { message } }) => {
        enqueueSnackbar(message, { variant: "error" });
      },
      onSuccess: () => {
        enqueueSnackbar(tAuth("twoFactor.otp.sent"), { variant: "success" });
        startCountdown("two-factor-otp");
      },
    });

    setIsSendingOtp(false);
  };

  const onSubmit = handleSubmit(async (data: TwoFactorForm) => {
    const { error } =
      method === TWO_FACTOR_METHOD.OTP
        ? await authClient.twoFactor.verifyOtp(data)
        : method === TWO_FACTOR_METHOD.BACKUP_CODE
          ? await authClient.twoFactor.verifyBackupCode(data)
          : await authClient.twoFactor.verifyTotp(data);

    if (error) {
      enqueueSnackbar(error.message, { variant: "error" });

      return;
    }

    const { data: session } = await authClient.getSession();
    setSession(session);

    const canAccessAdmin =
      session?.user.role === "admin" ||
      !!(await authClient.organization.list()).data?.length;

    if (!canAccessAdmin) {
      router.replace(
        getHref(NO_ADMIN_ACCESS_ROUTE, {
          [query.redirectTo]: redirectTo,
        }),
      );

      return;
    }

    enqueueSnackbar(
      tAuth("signIn.success", { email: session?.user.email ?? "" }),
      { variant: "success" },
    );

    router.replace(redirectTo || DEFAULT_AUTHENTICATED_ROUTE);
  });

  return (
    <FormCard component="form" onSubmit={onSubmit}>
      <StyledCardHeader
        title={
          <StyledTypography align="center" color="primary" variant="h6">
            {tAuth("twoFactor.label")}
          </StyledTypography>
        }
      />
      <StyledCardContent>
        <Typography align="center" color="textSecondary" variant="body2">
          {tAuth(`twoFactor.${method}.description`)}
        </Typography>
        {method === TWO_FACTOR_METHOD.OTP && (
          <Button
            disabled={isCountingDown}
            fullWidth
            loading={isSendingOtp}
            loadingPosition="end"
            onClick={handleSendOtp}
            variant="outlined"
          >
            {isCountingDown
              ? tAuth("twoFactor.countdown", {
                  actions: sendOtp,
                  seconds: countdown,
                })
              : sendOtp}
          </Button>
        )}
        <TextField
          autoComplete="one-time-code"
          error={!!errors.code}
          fullWidth
          helperText={errors.code?.message}
          label={tAuth(
            isBackupCode
              ? "twoFactor.backupCode.label"
              : "twoFactor.code.label",
          )}
          placeholder={tAuth(
            isBackupCode
              ? "twoFactor.backupCode.placeholder"
              : "twoFactor.code.placeholder",
          )}
          required
          slotProps={{
            htmlInput: isBackupCode ? undefined : { inputMode: "numeric" },
          }}
          {...register("code")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={trustDevice}
              onChange={({ target: { checked } }) =>
                setValue("trustDevice", checked)
              }
              size="small"
            />
          }
          label={
            <Typography variant="body2">
              {tAuth("twoFactor.trustDevice")}
            </Typography>
          }
        />
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
          {tAuth("twoFactor.verify")}
        </Button>
        <Divider flexItem />
        <SwitchMethodStack>
          {availableMethods
            .filter((availableMethod) => availableMethod !== method)
            .map((availableMethod) => (
              <Link
                component="button"
                key={availableMethod}
                onClick={handleMethodChange(availableMethod)}
                type="button"
                underline="hover"
                variant="body2"
              >
                {tAuth(`twoFactor.${availableMethod}.switch`)}
              </Link>
            ))}
          <Link href={signInHref} underline="hover" variant="body2">
            {tAuth("signIn.label")}
          </Link>
        </SwitchMethodStack>
      </StyledCardActions>
    </FormCard>
  );
};

export default AuthTwoFactor;
