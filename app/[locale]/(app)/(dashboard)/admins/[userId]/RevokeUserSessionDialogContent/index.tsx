"use client";

import type { Session } from "better-auth/types";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import {
  type RevokeUserSessionFormInput,
  revokeUserSessionFormSchema,
} from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { Stack, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

import { formatUserAgent } from "@/utils/auth";

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

interface RevokeUserSessionDialogContentProps {
  session: Pick<Session, "ipAddress" | "userAgent">;
}

const RevokeUserSessionDialogContent = ({
  session: { ipAddress, userAgent },
}: RevokeUserSessionDialogContentProps) => {
  const tUserSessions = useTranslations("admins.userSessions");

  const {
    formState: { errors },
    register,
  } = useForm<RevokeUserSessionFormInput>({
    defaultValues: {
      userAgent: formatUserAgent(userAgent),
      ipAddress: ipAddress || "",
    },
    resolver: zodResolver(revokeUserSessionFormSchema),
  });

  return (
    <StyledStack>
      <TextField
        error={!!errors.userAgent}
        fullWidth
        helperText={errors.userAgent?.message}
        label={tUserSessions("userAgent.label")}
        placeholder={tUserSessions("userAgent.placeholder")}
        required
        slotProps={{ input: { readOnly: true } }}
        {...register("userAgent")}
      />
      <TextField
        error={!!errors.ipAddress}
        fullWidth
        helperText={errors.ipAddress?.message}
        label={tUserSessions("ipAddress.label")}
        placeholder={tUserSessions("ipAddress.placeholder")}
        required
        slotProps={{ input: { readOnly: true } }}
        {...register("ipAddress")}
      />
    </StyledStack>
  );
};

export default RevokeUserSessionDialogContent;
