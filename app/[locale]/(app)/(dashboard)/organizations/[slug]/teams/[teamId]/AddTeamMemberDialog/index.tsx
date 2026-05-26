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
  availableMembers: Member[];
  mutate: () => void;
  teamId: string;
}

const AddTeamMemberDialog = ({
  availableMembers,
  mutate,
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
            availableMembers.find(({ userId: id }) => id === userId)?.user
              .email || "";
          const message = tTeams("actions.addTeamMember.success", { email });
          enqueueSnackbar(message, { variant: "success" });

          closeDialog();

          mutate();
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
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const member = availableMembers.find(
                ({ userId }) => userId === selected,
              );

              return member ? (
                tMembers("userId.option", {
                  email: member.user.email,
                  name: member.user.name,
                })
              ) : (
                <em>{tMembers("userId.placeholder")}</em>
              );
            },
          },
        }}
        value={userId}
        {...register("userId")}
      >
        <MenuItem disabled value="">
          <em>{tMembers("userId.placeholder")}</em>
        </MenuItem>
        {availableMembers.map(({ userId: memberId, user: { email, name } }) => (
          <MenuItem key={memberId} value={memberId}>
            {tMembers("userId.option", { email, name })}
          </MenuItem>
        ))}
      </TextField>
    </StyledBox>
  );
};

export default AddTeamMemberDialog;
