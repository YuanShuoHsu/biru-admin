"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type ConfirmRuleSetForm,
  MINIMUM_HOURLY_WAGE_MAX,
  useConfirmRuleSetFormSchema,
} from "./definitions";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api-client";

import { DialogContentText, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { toCents } from "@/utils/attendance";
import { getErrorMessage } from "@/utils/errors";

interface ConfirmRuleSetDialogProps {
  effectiveFrom: string;
  mutate: () => void;
  period: string;
}

const ConfirmRuleSetDialog = ({
  effectiveFrom,
  mutate,
  period,
}: ConfirmRuleSetDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tPayrollRuleSets = useTranslations("payrollRuleSets");

  const confirmRuleSetFormSchema = useConfirmRuleSetFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ConfirmRuleSetForm>({
    defaultValues: { minimumHourlyWage: 0, sourceLabel: "", sourceUrl: "" },
    resolver: zodResolver(confirmRuleSetFormSchema),
  });

  const minimumHourlyWage = useWatch({ control, name: "minimumHourlyWage" });

  const onSubmitHandler = async ({
    minimumHourlyWage,
    sourceLabel,
    sourceUrl,
  }: ConfirmRuleSetForm) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.PATCH("/api/payroll/rule-sets/{effectiveFrom}", {
        body: {
          minimumHourlyWageCents: toCents(minimumHourlyWage),
          sourceLabel,
          sourceUrl,
        },
        params: { path: { effectiveFrom } },
      });

      enqueueSnackbar(tPayrollRuleSets("confirm.success", { period }), {
        variant: "success",
      });

      closeDialog();

      mutate();
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
        <FormBox id="confirm-rule-set-form" onSubmit={onSubmit}>
          <DialogContentText>
            {tPayrollRuleSets("confirm.hint", { period })}
          </DialogContentText>
          <NumberSpinner
            error={!!errors.minimumHourlyWage}
            fullWidth
            helperText={errors.minimumHourlyWage?.message}
            label={tPayrollRuleSets("confirm.minimumHourlyWage")}
            max={MINIMUM_HOURLY_WAGE_MAX}
            min={0}
            onValueChange={(value) =>
              setValue("minimumHourlyWage", value ?? 0, {
                shouldValidate: isSubmitted,
              })
            }
            required
            step={0.01}
            value={minimumHourlyWage || null}
          />
          <TextField
            error={!!errors.sourceLabel}
            fullWidth
            helperText={errors.sourceLabel?.message}
            label={tPayrollRuleSets("confirm.sourceLabel.label")}
            placeholder={tPayrollRuleSets("confirm.sourceLabel.placeholder")}
            required
            {...register("sourceLabel")}
          />
          <TextField
            error={!!errors.sourceUrl}
            fullWidth
            helperText={errors.sourceUrl?.message}
            label={tPayrollRuleSets("confirm.sourceUrl.label")}
            placeholder="https://"
            required
            type="url"
            {...register("sourceUrl")}
          />
        </FormBox>
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default ConfirmRuleSetDialog;
