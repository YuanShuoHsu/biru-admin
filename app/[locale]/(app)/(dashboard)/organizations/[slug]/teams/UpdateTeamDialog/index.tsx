"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";

import { type TeamForm, useTeamFormSchema } from "./definitions";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { authClient } from "@/lib/auth-client";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization, Team } from "@/types/organizations";

interface UpdateTeamDialogProps {
  mutate: () => void;
  organizationId: Organization["id"];
  team?: Team;
}

const UpdateTeamDialog = ({
  mutate,
  organizationId,
  team,
}: UpdateTeamDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

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
          onError: ({ error: { message } }) => {
            enqueueSnackbar(message, { variant: "error" });

            setDialog({ confirmLoading: false });
          },
          onRequest: () => setDialog({ confirmLoading: true }),
          onSuccess: () => {
            const message = tTeams("actions.updateTeam.success", { name });
            enqueueSnackbar(message, { variant: "success" });

            closeDialog();

            mutate();
          },
        },
      );

      return;
    }

    await authClient.organization.createTeam(
      { name, organizationId },
      {
        onError: ({ error: { message } }) => {
          enqueueSnackbar(message, { variant: "error" });

          setDialog({ confirmLoading: false });
        },
        onRequest: () => setDialog({ confirmLoading: true }),
        onSuccess: () => {
          const message = tTeams("actions.createTeam.success", { name });
          enqueueSnackbar(message, { variant: "success" });

          closeDialog();

          mutate();
        },
      },
    );
  });

  return (
    <>
      <CustomizedDialogContent>
        <FormBox id="team-form" onSubmit={onSubmit}>
          <TextField
            error={!!errors.name}
            fullWidth
            helperText={errors.name?.message}
            label={tTeams("name.label")}
            placeholder={tTeams("name.placeholder")}
            required
            {...register("name")}
          />
        </FormBox>
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default UpdateTeamDialog;
