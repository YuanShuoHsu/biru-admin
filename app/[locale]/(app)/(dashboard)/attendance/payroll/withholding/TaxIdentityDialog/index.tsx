"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  TAX_IDENTITY_ADDRESS_MAX_LENGTH,
  type TaxIdentityForm,
  useTaxIdentityFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceErrorKey, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface TaxIdentityDialogProps {
  employeeId: string;
  mutate: () => void;
  organizationSlug: string;
}

const TaxIdentityDialog = ({
  employeeId,
  mutate,
  organizationSlug,
}: TaxIdentityDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const taxIdentityFormSchema = useTaxIdentityFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<TaxIdentityForm>({
    defaultValues: { address: "", taxId: "" },
    resolver: zodResolver(taxIdentityFormSchema),
  });

  const onSubmitHandler = async (values: TaxIdentityForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        payrollPath(organizationSlug, "org", `tax-identities/${employeeId}`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      enqueueSnackbar(tAttendance("withholding.identity.saved"), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch (error) {
      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="payroll-tax-identity-form" onSubmit={onSubmit}>
      <TextField
        autoComplete="off"
        error={!!errors.taxId}
        fullWidth
        helperText={errors.taxId?.message}
        label={tAttendance("withholding.taxId")}
        required
        slotProps={{ htmlInput: { maxLength: 10 } }}
        {...register("taxId")}
      />
      <TextField
        error={!!errors.address}
        fullWidth
        helperText={errors.address?.message}
        label={tAttendance("withholding.address")}
        required
        slotProps={{
          htmlInput: { maxLength: TAX_IDENTITY_ADDRESS_MAX_LENGTH },
        }}
        {...register("address")}
      />
    </FormBox>
  );
};

export default TaxIdentityDialog;
