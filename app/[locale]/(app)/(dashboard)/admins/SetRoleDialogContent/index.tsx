"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type SetRoleFormInput,
  type SetRoleFormOutput,
  useSetRoleFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { userRoleValues } from "@/types/api";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import type { User } from "@/types/admins";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

interface SetRoleDialogContentProps {
  mutateAdmins: () => void;
  user: User;
}

const SetRoleDialogContent = ({
  mutateAdmins,
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
    defaultValues: { email: user.email, role: user.role ?? undefined },
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

            mutateAdmins();
          },
        },
      );
    })(event);

  return (
    <FormBox id="set-role-form" onSubmit={onSubmit}>
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
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const selectedRole = userRoleValues.find(
                (role) => role === selected,
              );

              return selectedRole ? (
                tAdmins(`role.${selectedRole}`)
              ) : (
                <em>{tAdmins("role.placeholder")}</em>
              );
            },
          },
        }}
        value={role}
        {...register("role")}
      >
        <MenuItem disabled value="">
          <em>{tAdmins("role.placeholder")}</em>
        </MenuItem>
        {userRoleValues.map((role) => (
          <MenuItem key={role} value={role}>
            {tAdmins(`role.${role}`)}
          </MenuItem>
        ))}
      </TextField>
    </FormBox>
  );
};

export default SetRoleDialogContent;
