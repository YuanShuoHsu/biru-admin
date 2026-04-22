"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type UpdateMemberRoleFormInput,
  type UpdateMemberRoleFormOutput,
  useUpdateMemberRoleFormSchema,
} from "./definitions";

import { roles } from "@/constants/organizations";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, MenuItem, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Member } from "@/types/organizations";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface UpdateMemberRoleDialogContentProps {
  fetchFullOrganization: () => void;
  member: Member;
  organizationId: string;
}

const UpdateMemberRoleDialogContent = ({
  fetchFullOrganization,
  member,
  organizationId,
}: UpdateMemberRoleDialogContentProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tAdmins = useTranslations("admins");
  const tMembers = useTranslations("organizations.members");

  const updateMemberRoleFormSchema = useUpdateMemberRoleFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateMemberRoleFormInput, unknown, UpdateMemberRoleFormOutput>({
    defaultValues: { email: member.user.email, role: member.role },
    resolver: zodResolver(updateMemberRoleFormSchema),
  });

  const role = useWatch({ control, name: "role" });

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(async ({ role }) => {
      await authClient.organization.updateMemberRole(
        { organizationId, memberId: member.id, role },
        {
          onError: ({ error: { code } }) => {
            console.log(code);
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });

            setDialog({ confirmLoading: false });
          },
          onRequest: () => setDialog({ confirmLoading: true }),
          onSuccess: () => {
            const message = tMembers("actions.updateMemberRole.success");
            enqueueSnackbar(message, { variant: "success" });

            closeDialog();

            fetchFullOrganization();
          },
        },
      );
    })(event);

  return (
    <StyledBox
      component="form"
      id="update-member-role-form"
      onSubmit={onSubmit}
    >
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
        label={tMembers("role.label")}
        required
        select
        value={role}
        {...register("role")}
      >
        <MenuItem disabled value="">
          <em>{tMembers("role.placeholder")}</em>
        </MenuItem>
        {roles.map((role) => (
          <MenuItem key={role} value={role}>
            {tMembers(`role.${role}`)}
          </MenuItem>
        ))}
      </TextField>
    </StyledBox>
  );
};

export default UpdateMemberRoleDialogContent;
