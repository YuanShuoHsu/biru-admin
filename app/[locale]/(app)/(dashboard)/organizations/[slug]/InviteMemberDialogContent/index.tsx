// https://mui.com/material-ui/react-select/#MultipleSelectPlaceholder.tsx

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";

import {
  type InviteMemberFormInput,
  type InviteMemberFormOutput,
  roles,
  useInviteMemberFormSchema,
} from "./definitions";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { Box, type BoxProps, MenuItem, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

interface InviteMemberDialogContentProps {
  organizationId: string;
}

const InviteMemberDialogContent = ({
  organizationId,
}: InviteMemberDialogContentProps) => {
  const { resetDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const router = useRouter();

  const tMembers = useTranslations("organizations.members");

  const inviteMemberFormSchema = useInviteMemberFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<InviteMemberFormInput, unknown, InviteMemberFormOutput>({
    defaultValues: { email: "", role: "" },
    resolver: zodResolver(inviteMemberFormSchema),
  });

  const onSubmit = handleSubmit(
    async ({ email, role }: InviteMemberFormOutput) => {
      await authClient.organization.inviteMember(
        { email, organizationId, role },
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
            const message = tMembers("invite.success");
            enqueueSnackbar(message, { variant: "success" });

            resetDialog();
            router.refresh();
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
        label={tMembers("fields.email.label")}
        placeholder={tMembers("fields.email.placeholder")}
        required
        type="email"
        {...register("email")}
      />
      <TextField
        error={!!errors.role}
        fullWidth
        helperText={errors.role?.message}
        label={tMembers("fields.role.label")}
        required
        select
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

export default InviteMemberDialogContent;
