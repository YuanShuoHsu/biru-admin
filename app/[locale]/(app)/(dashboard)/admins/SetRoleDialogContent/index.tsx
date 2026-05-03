"use client";

import type { UserWithRole } from "better-auth/client/plugins";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type SetRoleFormInput,
  type SetRoleFormOutput,
  useSetRoleFormSchema,
} from "./definitions";

import { roles } from "@/constants/admins";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, MenuItem, styled, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface SetRoleDialogContentProps {
  fetchListUsers: () => void;
  user: UserWithRole;
}

const SetRoleDialogContent = ({
  fetchListUsers,
  user,
}: SetRoleDialogContentProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tAdmins = useTranslations("admins");

  const setRoleFormSchema = useSetRoleFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SetRoleFormInput, unknown, SetRoleFormOutput>({
    defaultValues: { email: user.email, role: user.role },
    resolver: zodResolver(setRoleFormSchema),
  });

  const role = useWatch({ control, name: "role" });

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(async ({ role }) => {
      await authClient.admin.setRole(
        { role, userId: user.id },
        {
          onError: ({ error: { code } }) => {
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });

            setDialog({ confirmLoading: false });
          },
          onRequest: () => setDialog({ confirmLoading: true }),
          onSuccess: () => {
            const message = tAdmins("actions.setRole.success");
            enqueueSnackbar(message, { variant: "success" });

            closeDialog();

            fetchListUsers();
          },
        },
      );
    })(event);

  return (
    <StyledBox component="form" id="set-role-form" onSubmit={onSubmit}>
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
        error={!!errors.role}
        fullWidth
        helperText={errors.role?.message}
        label={tAdmins("role.label")}
        required
        select
        slotProps={{ select: { displayEmpty: true } }}
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

export default SetRoleDialogContent;
