"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";

import {
  type InviteMemberForm,
  useInviteMemberFormSchema,
} from "./definitions";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  Box,
  type BoxProps,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  styled,
} from "@mui/material";

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
  const { resetDialog, setDialog } = useDialogStore((s) => s);

  const router = useRouter();

  const tMembers = useTranslations("organizations.members");

  const schema = useInviteMemberFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<InviteMemberForm>({
    defaultValues: { email: "", role: "member" },
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(
    async ({ email, role }: InviteMemberForm) => {
      await authClient.organization.inviteMember(
        { email, organizationId, role },
        {
          onRequest: () => {
            setDialog({ confirmLoading: true });
          },
          onError: () => {
            enqueueSnackbar(tMembers("invite.error"), { variant: "error" });
            setDialog({ confirmLoading: false });
          },
          onSuccess: () => {
            enqueueSnackbar(tMembers("invite.success"), {
              variant: "success",
            });
            resetDialog();
            router.refresh();
          },
        },
      );
    },
  );

  return (
    <StyledBox
      component="form"
      id="invite-member-form"
      onSubmit={onSubmit}
    >
      <TextField
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={tMembers("invite.fields.email")}
        required
        type="email"
        {...register("email")}
      />
      <FormControl fullWidth size="small">
        <InputLabel>{tMembers("invite.fields.role")}</InputLabel>
        <Select
          defaultValue="member"
          label={tMembers("invite.fields.role")}
          {...register("role")}
        >
          <MenuItem value="member">{tMembers("roles.member")}</MenuItem>
          <MenuItem value="admin">{tMembers("roles.admin")}</MenuItem>
        </Select>
      </FormControl>
    </StyledBox>
  );
};

export default InviteMemberDialogContent;
