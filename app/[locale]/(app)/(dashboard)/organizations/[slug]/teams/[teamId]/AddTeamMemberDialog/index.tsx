"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm, useWatch } from "react-hook-form";

import {
  type AddTeamMemberForm,
  useAddTeamMemberFormSchema,
} from "./definitions";

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

interface AddTeamMemberDialogProps {
  fetchFullOrganization: () => void;
  members: Member[];
  teamId: string;
}

const AddTeamMemberDialog = ({
  fetchFullOrganization,
  members,
  teamId,
}: AddTeamMemberDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");

  const addTeamMemberFormSchema = useAddTeamMemberFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<AddTeamMemberForm>({
    defaultValues: { userId: "" },
    resolver: zodResolver(addTeamMemberFormSchema),
  });

  const userId = useWatch({ control, name: "userId" });

  const onSubmit = handleSubmit(async ({ userId }) => {
    await authClient.organization.addTeamMember(
      { teamId, userId },
      {
        onError: ({ error: { code } }) => {
          const message = getErrorMessage(code, locale);
          enqueueSnackbar(message, { variant: "error" });

          setDialog({ confirmLoading: false });
        },
        onRequest: () => setDialog({ confirmLoading: true }),
        onSuccess: () => {
          const email =
            members.find(({ userId: id }) => id === userId)?.user.email ||
            userId;
          const message = tTeams("actions.addTeamMember.success", { email });
          enqueueSnackbar(message, { variant: "success" });

          closeDialog();

          fetchFullOrganization();
        },
      },
    );
  });

  return (
    <StyledBox component="form" id="add-team-member-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.userId}
        fullWidth
        helperText={errors.userId?.message}
        label={tMembers("userId.label")}
        required
        select
        value={userId}
        {...register("userId")}
      >
        <MenuItem disabled value="">
          <em>{tMembers("userId.placeholder")}</em>
        </MenuItem>
        {members.map(({ userId: memberId, user: { email, name } }) => (
          <MenuItem key={memberId} value={memberId}>
            {tMembers("userId.option", { email, name })}
          </MenuItem>
        ))}
      </TextField>
    </StyledBox>
  );
};

export default AddTeamMemberDialog;
