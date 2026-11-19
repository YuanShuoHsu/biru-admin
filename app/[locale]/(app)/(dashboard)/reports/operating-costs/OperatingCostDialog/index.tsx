"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  type OperatingCostForm,
  useOperatingCostFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { useMonthFormat } from "@/hooks/useMonthFormat";

import { apiClient } from "@/lib/api-client";

import { MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { operatingCostCategoryValues } from "@/types/api";
import type { OperatingCost } from "@/types/reports";

import { getErrorMessage } from "@/utils/errors";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const MONTH_FORMAT = "YYYY-MM";

interface OperatingCostDialogProps {
  mutate: () => void;
  operatingCost: OperatingCost | null;
  organizationSlug: string;
}

const OperatingCostDialog = ({
  mutate,
  operatingCost,
  organizationSlug,
}: OperatingCostDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const monthFormat = useMonthFormat();

  const tCommon = useTranslations("common");
  const tReports = useTranslations("reports");

  const operatingCostFormSchema = useOperatingCostFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<OperatingCostForm>({
    defaultValues: {
      category: operatingCost?.category ?? "rent",
      effectiveFrom:
        operatingCost?.effectiveFrom ??
        dayjs().tz(STORE_TIMEZONE).format(MONTH_FORMAT),
      monthlyAmount: operatingCost
        ? String(Number(operatingCost.monthlyAmount))
        : "",
      note: operatingCost?.note ?? "",
    },
    resolver: zodResolver(operatingCostFormSchema),
  });

  const [category, effectiveFrom, monthlyAmount] = useWatch({
    control,
    name: ["category", "effectiveFrom", "monthlyAmount"],
  });

  const action = operatingCost ? "update" : "create";

  const onSubmitHandler = async (values: OperatingCostForm) => {
    try {
      setDialog({ confirmLoading: true });

      const body = { ...values, note: values.note || null };

      await (operatingCost
        ? apiClient.PATCH(
            "/api/organizations/{organizationSlug}/operating-costs/{operatingCostId}",
            {
              body,
              params: {
                path: { organizationSlug, operatingCostId: operatingCost.id },
              },
            },
          )
        : apiClient.POST(
            "/api/organizations/{organizationSlug}/operating-costs",
            { body, params: { path: { organizationSlug } } },
          ));

      enqueueSnackbar(tReports(`operatingCosts.actions.${action}.success`), {
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
    <FormBox id="operating-cost-form" onSubmit={onSubmit}>
      <TextField
        fullWidth
        helperText={
          category === "personnel"
            ? tReports("operatingCosts.category.personnelHint")
            : undefined
        }
        label={tReports("operatingCosts.category.label")}
        onChange={(event) =>
          setValue(
            "category",
            event.target.value as OperatingCostForm["category"],
          )
        }
        required
        select
        value={category}
      >
        {operatingCostCategoryValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tReports(`operatingCosts.category.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <DatePicker
        format={monthFormat}
        label={tReports("operatingCosts.effectiveFrom.label")}
        onChange={(value) =>
          setValue(
            "effectiveFrom",
            value?.isValid() ? value.format(MONTH_FORMAT) : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.effectiveFrom,
            fullWidth: true,
            helperText:
              errors.effectiveFrom?.message ||
              tReports("operatingCosts.effectiveFrom.hint"),
            required: true,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={effectiveFrom ? dayjs(effectiveFrom, MONTH_FORMAT) : null}
        views={["year", "month"]}
      />
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={2}
        error={!!errors.monthlyAmount}
        fullWidth
        helperText={
          errors.monthlyAmount?.message ||
          tReports("operatingCosts.monthlyAmount.hint")
        }
        isAllowed={({ floatValue }) =>
          floatValue === undefined || floatValue <= 9999999999.99
        }
        label={tReports("operatingCosts.monthlyAmount.label")}
        name="monthlyAmount"
        onValueChange={({ value }) =>
          setValue("monthlyAmount", value, { shouldValidate: isSubmitted })
        }
        required
        thousandSeparator=","
        value={monthlyAmount}
        valueIsNumericString
      />
      <TextField
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={`${tReports("operatingCosts.note.label")} ${tCommon("optional")}`}
        {...register("note")}
      />
    </FormBox>
  );
};

export default OperatingCostDialog;
