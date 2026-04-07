// https://mui.com/material-ui/react-select/#MultipleSelectPlaceholder.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm, useWatch } from "react-hook-form";

import {
  type InviteMemberFormInput,
  type InviteMemberFormOutput,
  useInviteMemberFormSchema,
} from "./definitions";

import { roles } from "@/constants/organizations";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, MenuItem, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface InviteMemberDialogContentProps {
  fetchData: () => void;
  organizationId: string;
}

const InviteMemberDialogContent = ({
  fetchData,
  organizationId,
}: InviteMemberDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tMembers = useTranslations("organizations.members");

  const inviteMemberFormSchema = useInviteMemberFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<InviteMemberFormInput, unknown, InviteMemberFormOutput>({
    defaultValues: { email: "", role: "" },
    resolver: zodResolver(inviteMemberFormSchema),
  });

  const role = useWatch({ control, name: "role" });

  const onSubmit = handleSubmit(
    async ({ email, role }: InviteMemberFormOutput) => {
      await authClient.organization.inviteMember(
        { email, organizationId, role },
        {
          headers: { "Accept-Language": locale },
          onRequest: () => {
            setDialog({ confirmLoading: true });
          },
          onError: ({ error: { code } }) => {
            const message = getErrorMessage(code, locale);
            enqueueSnackbar(message, { variant: "error" });

            setDialog({ confirmLoading: false });
          },
          onSuccess: () => {
            const message = tMembers("actions.invite.success");
            enqueueSnackbar(message, { variant: "success" });

            resetDialog();
            fetchData();
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
        label={tMembers("actions.invite.email.label")}
        placeholder={tMembers("actions.invite.email.placeholder")}
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

export default InviteMemberDialogContent;
