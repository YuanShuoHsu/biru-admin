"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type EarningTypeForm, useEarningTypeFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { payrollEarningCategoryValues } from "@/types/api";
import type { PayrollEarningType } from "@/types/attendance";

import { attendanceErrorKey, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface EarningTypeDialogProps {
  earningType?: PayrollEarningType;
  mutate: () => void;
  organizationSlug: string;
}

const EarningTypeDialog = ({
  earningType,
  mutate,
  organizationSlug,
}: EarningTypeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const earningTypeFormSchema = useEarningTypeFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<EarningTypeForm>({
    defaultValues: {
      category: earningType?.category ?? "wage",
      name: earningType?.name ?? "",
    },
    resolver: zodResolver(earningTypeFormSchema),
  });

  const category = useWatch({ control, name: "category" });

  const onSubmitHandler = async (values: EarningTypeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        payrollPath(
          organizationSlug,
          "org",
          earningType ? `earning-types/${earningType.id}` : "earning-types",
        ),
        {
          method: earningType ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(earningType ? { name: values.name } : values),
        },
      );

      enqueueSnackbar(
        tAttendance(
          earningType
            ? "earningTypes.actions.update.success"
            : "earningTypes.actions.create.success",
          { name: values.name },
        ),
        { variant: "success" },
      );

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
    <FormBox id="payroll-earning-type-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tAttendance("name")}
        required
        {...register("name")}
      />
      <TextField
        disabled={!!earningType}
        fullWidth
        helperText={tAttendance(`earningCategory.descriptions.${category}`)}
        label={tAttendance("earningCategory.label")}
        onChange={(event) =>
          setValue(
            "category",
            event.target.value as EarningTypeForm["category"],
          )
        }
        required
        select
        value={category}
      >
        {payrollEarningCategoryValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`earningCategory.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
    </FormBox>
  );
};

export default EarningTypeDialog;
