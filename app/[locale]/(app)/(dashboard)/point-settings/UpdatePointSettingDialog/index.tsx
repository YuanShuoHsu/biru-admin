"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  type UpdatePointSettingForm,
  useUpdatePointSettingFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";

import { apiClient } from "@/lib/api-client";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { PointSetting } from "@/types/points";

import { getErrorMessage } from "@/utils/errors";

const toFormValue = (value: number | string | null) =>
  value != null ? String(Number(value)) : "";

const toNumberOrNull = (value: string) => (value !== "" ? Number(value) : null);

interface UpdatePointSettingDialogProps {
  pointSetting: PointSetting;
}

const UpdatePointSettingDialog = ({
  pointSetting,
}: UpdatePointSettingDialogProps) => {
  const router = useRouter();

  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tPointSettings = useTranslations("pointSettings");

  const updatePointSettingFormSchema = useUpdatePointSettingFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<UpdatePointSettingForm>({
    defaultValues: {
      accountingValuePerPoint: toFormValue(
        pointSetting.accountingValuePerPoint,
      ),
      amountPerPoint: toFormValue(pointSetting.amountPerPoint),
      pointsValidityYears: toFormValue(pointSetting.pointsValidityYears),
    },
    resolver: zodResolver(updatePointSettingFormSchema),
  });

  const [accountingValuePerPoint, amountPerPoint, pointsValidityYears] =
    useWatch({
      control,
      name: [
        "accountingValuePerPoint",
        "amountPerPoint",
        "pointsValidityYears",
      ],
    });

  const enabled = amountPerPoint !== "";

  const onSubmitHandler = async (values: UpdatePointSettingForm) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.PATCH("/api/point-settings", {
        body: {
          accountingValuePerPoint: toNumberOrNull(
            values.accountingValuePerPoint,
          ),
          amountPerPoint: toNumberOrNull(values.amountPerPoint),
          pointsValidityYears: enabled
            ? toNumberOrNull(values.pointsValidityYears)
            : null,
        },
      });

      enqueueSnackbar(tPointSettings("update.success"), {
        variant: "success",
      });

      closeDialog();

      router.refresh();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="update-point-setting-form" onSubmit={onSubmit}>
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={2}
        error={!!errors.amountPerPoint}
        fullWidth
        helperText={
          errors.amountPerPoint?.message ||
          tPointSettings("amountPerPoint.hint")
        }
        isAllowed={({ floatValue }) =>
          floatValue === undefined || floatValue <= 99999999.99
        }
        label={`${tPointSettings("amountPerPoint.label")} ${tCommon("optional")}`}
        name="amountPerPoint"
        onValueChange={({ value }) =>
          setValue("amountPerPoint", value, { shouldValidate: isSubmitted })
        }
        placeholder={tPointSettings("amountPerPoint.placeholder")}
        thousandSeparator=","
        value={amountPerPoint}
        valueIsNumericString
      />
      <NumberSpinner
        clearable
        disabled={!enabled}
        fullWidth
        helperText={
          enabled ? undefined : tPointSettings("pointsValidityYears.disabled")
        }
        label={`${tPointSettings("pointsValidityYears.label")} ${tCommon("optional")}`}
        max={100}
        min={1}
        onValueChange={(value) =>
          setValue("pointsValidityYears", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tPointSettings("pointsValidityYears.placeholder")}
        value={
          enabled && pointsValidityYears !== ""
            ? Number(pointsValidityYears)
            : null
        }
      />
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={2}
        fullWidth
        helperText={tPointSettings("accountingValuePerPoint.hint")}
        isAllowed={({ floatValue }) =>
          floatValue === undefined || floatValue <= 99999999.99
        }
        label={`${tPointSettings("accountingValuePerPoint.label")} ${tCommon("optional")}`}
        name="accountingValuePerPoint"
        onValueChange={({ value }) =>
          setValue("accountingValuePerPoint", value, {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tPointSettings("accountingValuePerPoint.placeholder")}
        thousandSeparator=","
        value={accountingValuePerPoint}
        valueIsNumericString
      />
    </FormBox>
  );
};

export default UpdatePointSettingDialog;
