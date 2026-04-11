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

import { formatUserAgent } from "@/utils/admins";

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
      ipAddress: ipAddress || "",
      userAgent: formatUserAgent(userAgent),
    },
    resolver: zodResolver(revokeUserSessionFormSchema),
  });

  return (
    <Stack gap={2}>
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
    </Stack>
  );
};

export default RevokeUserSessionDialogContent;
