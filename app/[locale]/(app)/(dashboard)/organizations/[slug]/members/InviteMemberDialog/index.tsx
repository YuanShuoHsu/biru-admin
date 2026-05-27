// https://mui.com/material-ui/react-select/#MultipleSelectPlaceholder.tsx

"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm, useWatch } from "react-hook-form";

import {
  type InviteMemberFormInput,
  type InviteMemberFormOutput,
  useInviteMemberFormSchema,
} from "./definitions";

import { roles } from "@/constants/organizations";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, MenuItem, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization, Team } from "@/types/organizations";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface InviteMemberDialogProps {
  mutate: () => void;
  organizationId: Organization["id"];
  teams: Team[];
}

const InviteMemberDialog = ({
  mutate,
  organizationId,
  teams,
}: InviteMemberDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tMembers = useTranslations("organizations.members");
  const tTeams = useTranslations("organizations.teams");

  const inviteMemberFormSchema = useInviteMemberFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<InviteMemberFormInput, unknown, InviteMemberFormOutput>({
    defaultValues: { email: "", role: "", teamId: "" },
    resolver: zodResolver(inviteMemberFormSchema),
  });

  const role = useWatch({ control, name: "role" });
  const teamId = useWatch({ control, name: "teamId" });

  const onSubmit = handleSubmit(
    async ({ email, role, teamId }: InviteMemberFormOutput) => {
      await authClient.organization.inviteMember(
        { email, organizationId, role, teamId: teamId || undefined },
        {
          headers: { "Accept-Language": locale },
          onError: ({ error: { code } }) => {
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });

            setDialog({ confirmLoading: false });
          },
          onRequest: () => setDialog({ confirmLoading: true }),
          onSuccess: () => {
            const selectedTeam = teams.find(({ id }) => id === teamId);
            enqueueSnackbar(
              selectedTeam
                ? tMembers("actions.inviteMember.success.withTeam", {
                    email,
                    team: selectedTeam.name,
                  })
                : tMembers("actions.inviteMember.success.default", { email }),
              { variant: "success" },
            );

            closeDialog();

            mutate();
          },
        },
      );
    },
  );

  return (
    <StyledBox component="form" id="invite-member-form" onSubmit={onSubmit}>
      <TextField
        autoComplete="email"
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={tMembers("actions.inviteMember.email.label")}
        placeholder={tMembers("actions.inviteMember.email.placeholder")}
        required
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
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) =>
              selected ? (
                tMembers(`role.${selected as (typeof roles)[number]}`)
              ) : (
                <em>{tMembers("role.placeholder")}</em>
              ),
          },
        }}
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
      <TextField
        error={!!errors.teamId}
        fullWidth
        helperText={errors.teamId?.message}
        label={tTeams("teamId.label")}
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const team = teams.find(({ id }) => id === selected);

              return team ? team.name : <em>{tTeams("teamId.placeholder")}</em>;
            },
          },
        }}
        value={teamId}
        {...register("teamId")}
      >
        <MenuItem disabled value="">
          <em>{tTeams("teamId.placeholder")}</em>
        </MenuItem>
        {teams.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
    </StyledBox>
  );
};

export default InviteMemberDialog;
