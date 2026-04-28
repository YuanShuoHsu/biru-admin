"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";

import { type TeamForm, useTeamFormSchema } from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Team } from "@/types/organizations";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface TeamDialogContentProps {
  fetchFullOrganization: () => void;
  organizationId: string;
  team?: Team;
}

const TeamDialogContent = ({
  fetchFullOrganization,
  organizationId,
  team,
}: TeamDialogContentProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");
  const tTeams = useTranslations("organizations.teams");

  const teamFormSchema = useTeamFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<TeamForm>({
    defaultValues: { name: team?.name || "" },
    resolver: zodResolver(teamFormSchema),
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    if (team) {
      await authClient.organization.updateTeam(
        { teamId: team.id, data: { name } },
        {
          headers: { "Accept-Language": locale },
          onError: ({ error: { code } }) => {
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });

            setDialog({ confirmLoading: false });
          },
          onRequest: () => setDialog({ confirmLoading: true }),
          onSuccess: () => {
            const message = tTeams("actions.updateTeam.success", { name });
            enqueueSnackbar(message, { variant: "success" });

            closeDialog();

            fetchFullOrganization();
          },
        },
      );

      return;
    }

    await authClient.organization.createTeam(
      { name, organizationId },
      {
        headers: { "Accept-Language": locale },
        onError: ({ error: { code } }) => {
          const message = getErrorMessage(code, locale);
          enqueueSnackbar(message, { variant: "error" });

          setDialog({ confirmLoading: false });
        },
        onRequest: () => setDialog({ confirmLoading: true }),
        onSuccess: () => {
          const message = tTeams("actions.createTeam.success");
          enqueueSnackbar(message, { variant: "success" });

          closeDialog();

          fetchFullOrganization();
        },
      },
    );
  });

  return (
    <StyledBox component="form" id="team-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tOrganizations("name.label")}
        placeholder={tTeams("name.placeholder")}
        required
        {...register("name")}
      />
    </StyledBox>
  );
};

export default TeamDialogContent;
