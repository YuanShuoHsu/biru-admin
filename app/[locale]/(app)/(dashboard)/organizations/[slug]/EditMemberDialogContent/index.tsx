"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type EditMemberFormInput,
  type EditMemberFormOutput,
  roles,
  useEditMemberFormSchema,
} from "./definitions";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, MenuItem, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Member } from "@/types/auth";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface EditMemberDialogContentProps {
  fetchData: () => void;
  member: Member;
  organizationId: string;
}

const EditMemberDialogContent = ({
  fetchData,
  member,
  organizationId,
}: EditMemberDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tMembers = useTranslations("organizations.members");

  const editMemberFormSchema = useEditMemberFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<EditMemberFormInput, unknown, EditMemberFormOutput>({
    defaultValues: { role: member.role },
    resolver: zodResolver(editMemberFormSchema),
  });

  const role = useWatch({ control, name: "role" });

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(async ({ role }) => {
      await authClient.organization.updateMemberRole(
        { organizationId, memberId: member.id, role },
        {
          onRequest: () => {
            setDialog({ confirmLoading: true });
          },
          onError: ({ error: { code } }) => {
            console.log(code);
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });

            setDialog({ confirmLoading: false });
          },
          onSuccess: () => {
            const message = tMembers("setRole.success");
            enqueueSnackbar(message, { variant: "success" });

            resetDialog();
            fetchData();
          },
        },
      );
    })(event);

  return (
    <StyledBox component="form" id="edit-member-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.role}
        fullWidth
        helperText={errors.role?.message}
        label={tMembers("fields.role.label")}
        required
        select
        value={role}
        {...register("role")}
      >
        <MenuItem disabled value="">
          <em>{tMembers("fields.role.placeholder")}</em>
        </MenuItem>
        {roles.map((role) => (
          <MenuItem key={role} value={role}>
            {tMembers(`roles.${role}`)}
          </MenuItem>
        ))}
      </TextField>
    </StyledBox>
  );
};

export default EditMemberDialogContent;
