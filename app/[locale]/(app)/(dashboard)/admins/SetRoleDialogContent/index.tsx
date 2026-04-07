"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { UserWithRole } from "better-auth/client/plugins";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { roles } from "@/constants/admins";

import {
  type SetRoleFormInput,
  type SetRoleFormOutput,
  useSetRoleFormSchema,
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

interface SetRoleDialogContentProps {
  fetchData: () => void;
  user: UserWithRole;
}

const SetRoleDialogContent = ({
  fetchData,
  user,
}: SetRoleDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tAdmins = useTranslations("admins");

  const setRoleFormSchema = useSetRoleFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SetRoleFormInput, unknown, SetRoleFormOutput>({
    defaultValues: { role: user.role },
    resolver: zodResolver(setRoleFormSchema),
  });

  const role = useWatch({ control, name: "role" });

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(async ({ role }) => {
      await authClient.admin.setRole(
        { role, userId: user.id },
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
            const message = tAdmins("actions.setRole.success");
            enqueueSnackbar(message, { variant: "success" });

            resetDialog();
            fetchData();
          },
        },
      );
    })(event);

  return (
    <StyledBox component="form" id="set-role-form" onSubmit={onSubmit}>
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

export default SetRoleDialogContent;
