"use client";

import type { BaseSyntheticEvent } from "react";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm } from "react-hook-form";

import { QUANT_CREDENTIALS_URL } from "../../useQuantCredentials";
import { type CredentialForm, useCredentialFormSchema } from "./definitions";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { CreateQuantCredentialDto, QuantCredential } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const CREDENTIAL_FORM_ID = "quant-credential-form";

interface CredentialDialogProps {
  onCreated: (credential: QuantCredential) => void;
}

const CredentialDialog = ({ onCreated }: CredentialDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tQuant = useTranslations("quant");

  const credentialFormSchema = useCredentialFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CredentialForm>({
    defaultValues: { apiKey: "", apiSecret: "", label: "" },
    resolver: zodResolver(credentialFormSchema),
  });

  const onSubmitHandler = async (values: CredentialForm) => {
    try {
      setDialog({ confirmLoading: true });

      const created = await fetcher<QuantCredential>(QUANT_CREDENTIALS_URL, {
        body: JSON.stringify(values satisfies CreateQuantCredentialDto),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      enqueueSnackbar(tQuant("settings.add.success"), { variant: "success" });
      closeDialog();
      onCreated(created);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <>
      <CustomizedDialogContent>
        <FormBox
          autoComplete="off"
          id={CREDENTIAL_FORM_ID}
          noValidate
          onSubmit={onSubmit}
        >
          <Alert severity="info">{tQuant("settings.hint")}</Alert>
          <TextField
            {...register("label")}
            error={!!errors.label}
            fullWidth
            helperText={errors.label?.message}
            label={tQuant("settings.form.label")}
            placeholder={tQuant("settings.form.labelPlaceholder")}
            required
          />
          <TextField
            {...register("apiKey")}
            error={!!errors.apiKey}
            fullWidth
            helperText={errors.apiKey?.message}
            label={tQuant("settings.form.apiKey")}
            required
            slotProps={{
              htmlInput: { autoComplete: "off", spellCheck: false },
            }}
          />
          <TextField
            {...register("apiSecret")}
            error={!!errors.apiSecret}
            fullWidth
            helperText={errors.apiSecret?.message}
            label={tQuant("settings.form.apiSecret")}
            required
            slotProps={{ htmlInput: { autoComplete: "new-password" } }}
            type="password"
          />
        </FormBox>
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default CredentialDialog;
