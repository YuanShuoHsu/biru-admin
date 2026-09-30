"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  UNIT_ADDRESS_MAX_LENGTH,
  UNIT_TEXT_FIELDS,
  type UnitForm,
  useUnitFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { PayrollWithholdingUnit } from "@/types/attendance";

import { attendanceErrorKey, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface UnitDialogProps {
  mutate: () => void;
  organizationSlug: string;
  unit: PayrollWithholdingUnit | null;
}

const UnitDialog = ({ mutate, organizationSlug, unit }: UnitDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const unitFormSchema = useUnitFormSchema();

  const {
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    setValue,
  } = useForm<UnitForm>({
    defaultValues: unit ?? {
      address: "",
      agentName: "",
      businessNumber: "",
      contactEmail: "",
      contactName: "",
      contactPhone: "",
      name: "",
      representativeName: "",
      taxOfficeCode: "",
      taxRegistrationNumber: "",
    },
    resolver: zodResolver(unitFormSchema),
  });

  const businessNumberField = register("businessNumber");

  // 營利事業的扣繳義務人即負責人（所得稅法 §89）
  const fillAgentName = (representativeName: string) => {
    if (!getValues("agentName")) setValue("agentName", representativeName);
  };

  const fillFromRegistry = async (businessNumber: string) => {
    if (!/^\d{8}$/.test(businessNumber) || getValues("name")) return;

    try {
      const { address, name, representativeName } = await fetcher<{
        address: string;
        name: string;
        representativeName: string;
      }>(`/api/gcis/${businessNumber}`);

      setValue("name", name);

      if (!getValues("address") && address.length <= UNIT_ADDRESS_MAX_LENGTH)
        setValue("address", address);

      if (!getValues("representativeName")) {
        setValue("representativeName", representativeName);

        fillAgentName(representativeName);
      }
    } catch {
      return;
    }
  };

  const onSubmitHandler = async (values: UnitForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(payrollPath(organizationSlug, "org", "withholding-unit"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      enqueueSnackbar(tAttendance("withholding.unit.saved"), {
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
    <FormBox id="payroll-withholding-unit-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.businessNumber}
        fullWidth
        helperText={errors.businessNumber?.message}
        label={tAttendance("withholding.unit.fields.businessNumber")}
        required
        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
        {...businessNumberField}
        onBlur={(event) => {
          businessNumberField.onBlur(event);
          fillFromRegistry(event.target.value);
        }}
      />
      {UNIT_TEXT_FIELDS.map(({ max, name }) => (
        <TextField
          error={!!errors[name]}
          fullWidth
          helperText={errors[name]?.message}
          key={name}
          label={tAttendance(`withholding.unit.fields.${name}`)}
          required
          slotProps={{ htmlInput: { maxLength: max } }}
          {...register(name, {
            onBlur:
              name === "representativeName"
                ? (event) => fillAgentName(event.target.value.trim())
                : undefined,
          })}
        />
      ))}
      <TextField
        error={!!errors.taxOfficeCode}
        fullWidth
        helperText={errors.taxOfficeCode?.message}
        label={tAttendance("withholding.unit.fields.taxOfficeCode")}
        required
        slotProps={{ htmlInput: { maxLength: 3 } }}
        {...register("taxOfficeCode")}
      />
      <TextField
        error={!!errors.taxRegistrationNumber}
        fullWidth
        helperText={errors.taxRegistrationNumber?.message}
        label={tAttendance("withholding.unit.fields.taxRegistrationNumber")}
        required
        slotProps={{ htmlInput: { maxLength: 9 } }}
        {...register("taxRegistrationNumber")}
      />
      <TextField
        error={!!errors.contactPhone}
        fullWidth
        helperText={errors.contactPhone?.message}
        label={tAttendance("withholding.unit.fields.contactPhone")}
        required
        slotProps={{ htmlInput: { inputMode: "tel", maxLength: 15 } }}
        {...register("contactPhone")}
      />
      <TextField
        error={!!errors.contactEmail}
        fullWidth
        helperText={errors.contactEmail?.message}
        label={tAttendance("withholding.unit.fields.contactEmail")}
        required
        slotProps={{ htmlInput: { maxLength: 30 } }}
        type="email"
        {...register("contactEmail")}
      />
    </FormBox>
  );
};

export default UnitDialog;
