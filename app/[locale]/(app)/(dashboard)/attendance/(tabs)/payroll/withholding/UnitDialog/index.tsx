"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useSWRConfig } from "swr";
import useSWRImmutable from "swr/immutable";

import {
  UNIT_TEXT_FIELDS,
  UNIT_TEXT_MAX_LENGTH,
  type UnitForm,
  useUnitFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { PayrollWithholdingUnit } from "@/types/attendance";
import type { BusinessInfoResponse } from "@/types/gcis";

import { payrollPath } from "@/utils/attendance";
import {
  BUSINESS_NUMBER_PATTERN,
  isValidBusinessNumber,
} from "@/utils/businessNumber";
import { getErrorMessage } from "@/utils/errors";
import { type FetchError, fetcher } from "@/utils/fetcher";

const BUSINESS_INFO_FIELDS = ["address", "name", "representativeName"] as const;

type BusinessInfo = Pick<
  BusinessInfoResponse,
  (typeof BUSINESS_INFO_FIELDS)[number]
>;

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
    clearErrors,
    control,
    formState: { errors, isSubmitted },
    getValues,
    handleSubmit,
    register,
    setValue,
    trigger,
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

  const [
    address,
    agentName,
    businessNumber,
    contactName,
    name,
    representativeName,
  ] = useWatch({
    control,
    name: [
      "address",
      "agentName",
      "businessNumber",
      "contactName",
      "name",
      "representativeName",
    ],
  });

  const textValues = {
    address,
    agentName,
    contactName,
    name,
    representativeName,
  };

  // 營利事業的扣繳義務人即負責人（所得稅法 §89）
  const syncAgentName = (
    previousRepresentativeName: string,
    nextRepresentativeName: string,
    options: { shouldValidate: boolean },
  ) => {
    const agentName = getValues("agentName").trim();

    if (!agentName || agentName === previousRepresentativeName.trim())
      setValue("agentName", nextRepresentativeName, options);
  };

  const fillBusinessInfo = (
    businessInfo: BusinessInfo,
    options: { shouldValidate: boolean },
  ) => {
    syncAgentName(
      getValues("representativeName"),
      businessInfo.representativeName,
      options,
    );
    BUSINESS_INFO_FIELDS.forEach((field) =>
      setValue(field, businessInfo[field], options),
    );
    // setValue 不受 maxLength 限制，超長的登記資料要馬上標出來讓使用者縮短
    const overflowing = UNIT_TEXT_FIELDS.filter(
      (field) => getValues(field).length > UNIT_TEXT_MAX_LENGTH[field],
    );
    if (overflowing.length) void trigger(overflowing);
  };

  const [fetchedBusinessNumber, setFetchedBusinessNumber] = useState(
    unit?.businessNumber ?? "",
  );

  // https://swr.vercel.app/docs/advanced/cache#access-current-cache-provider
  const { cache } = useSWRConfig();

  // https://swr.vercel.app/docs/revalidation#disable-automatic-revalidations
  const { error: businessInfoError } = useSWRImmutable<
    BusinessInfoResponse,
    FetchError
  >(
    // 已儲存的統編不查詢，否則查詢結果會蓋掉使用者存過的名稱與地址
    isValidBusinessNumber(businessNumber) &&
      businessNumber !== unit?.businessNumber
      ? `/api/gcis/${businessNumber}`
      : null,
    {
      onError: () => {
        if (isSubmitted) void trigger(BUSINESS_INFO_FIELDS);
      },
      onSuccess: (data) =>
        fillBusinessInfo(data, { shouldValidate: isSubmitted }),
      shouldRetryOnError: false,
    },
  );

  const businessInfoErrorMessage =
    !!businessInfoError && !name.trim() && getErrorMessage(businessInfoError);
  const isBusinessInfoNotFound =
    !!businessInfoErrorMessage && businessInfoError?.status === 404;

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
      enqueueSnackbar(getErrorMessage(error), {
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
        error={!!errors.businessNumber || isBusinessInfoNotFound}
        fullWidth
        helperText={errors.businessNumber?.message || businessInfoErrorMessage}
        label={tAttendance("withholding.unit.fields.businessNumber")}
        required
        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
        {...register("businessNumber", {
          onChange: (event) => {
            const nextBusinessNumber = event.target.value;
            if (isSubmitted || BUSINESS_NUMBER_PATTERN.test(nextBusinessNumber))
              void trigger("businessNumber");
            else clearErrors("businessNumber");
            if (
              !isValidBusinessNumber(nextBusinessNumber) ||
              nextBusinessNumber === fetchedBusinessNumber
            )
              return;
            setFetchedBusinessNumber(nextBusinessNumber);
            const nextBusinessInfo: BusinessInfo | undefined =
              nextBusinessNumber === unit?.businessNumber
                ? unit
                : cache.get(`/api/gcis/${nextBusinessNumber}`)?.data;
            if (nextBusinessInfo)
              return fillBusinessInfo(nextBusinessInfo, {
                shouldValidate: isSubmitted,
              });
            // 查詢結果回來前不驗證，否則送出過後會先閃出必填錯誤
            fillBusinessInfo(
              { address: "", name: "", representativeName: "" },
              { shouldValidate: false },
            );
            clearErrors(BUSINESS_INFO_FIELDS);
          },
        })}
      />
      {UNIT_TEXT_FIELDS.map((field) => (
        <TextField
          error={!!errors[field]}
          fullWidth
          helperText={errors[field]?.message}
          key={field}
          label={tAttendance(`withholding.unit.fields.${field}`)}
          required
          slotProps={{
            htmlInput: { maxLength: UNIT_TEXT_MAX_LENGTH[field] },
            // https://mui.com/material-ui/react-text-field/#shrink
            inputLabel: { shrink: !!textValues[field] || undefined },
          }}
          {...register(field, {
            onChange:
              field === "representativeName"
                ? (event) =>
                    syncAgentName(representativeName, event.target.value, {
                      shouldValidate: isSubmitted,
                    })
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
