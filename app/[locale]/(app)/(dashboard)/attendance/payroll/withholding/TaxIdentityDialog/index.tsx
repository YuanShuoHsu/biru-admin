"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  FOREIGN_TAX_ID_MAX_LENGTH,
  TAX_IDENTITY_ADDRESS_MAX_LENGTH,
  type TaxIdentityForm,
  useTaxIdentityFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Autocomplete, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { residenceCountryCodeValues } from "@/types/api";

import { attendanceErrorKey, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const OTHER_COUNTRY_CODE = "ZZ";

interface TaxIdentityDialogProps {
  employeeId: string;
  foreign: boolean;
  mutate: () => void;
  organizationSlug: string;
}

const TaxIdentityDialog = ({
  employeeId,
  foreign,
  mutate,
  organizationSlug,
}: TaxIdentityDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const locale = useLocale();

  const taxIdentityFormSchema = useTaxIdentityFormSchema(foreign);

  const regionNames = useMemo(
    () => new Intl.DisplayNames([locale], { type: "region" }),
    [locale],
  );

  const countryLabel = (code: string) =>
    code === OTHER_COUNTRY_CODE
      ? `${code} ${tAttendance("withholding.otherCountry")}`
      : `${code} ${regionNames.of(code) ?? ""}`;

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<TaxIdentityForm>({
    defaultValues: {
      address: "",
      foreignTaxId: "",
      residenceCountryCode: null,
      taxId: "",
    },
    resolver: zodResolver(taxIdentityFormSchema),
  });

  const residenceCountryCode = useWatch({
    control,
    name: "residenceCountryCode",
  });

  const onSubmitHandler = async ({
    address,
    foreignTaxId,
    residenceCountryCode: countryCode,
    taxId,
  }: TaxIdentityForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        payrollPath(organizationSlug, "org", `tax-identities/${employeeId}`),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address,
            taxId,
            ...(foreign && {
              foreignTaxId,
              residenceCountryCode: countryCode,
            }),
          }),
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
        label={tAttendance(
          foreign ? "withholding.residentCertificateId" : "withholding.taxId",
        )}
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
      {foreign && (
        <>
          <Autocomplete
            getOptionLabel={countryLabel}
            onChange={(_event, value) =>
              setValue("residenceCountryCode", value, {
                shouldValidate: isSubmitted,
              })
            }
            options={residenceCountryCodeValues}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!!errors.residenceCountryCode}
                helperText={errors.residenceCountryCode?.message}
                label={tAttendance("withholding.residenceCountry")}
                required
              />
            )}
            value={residenceCountryCode}
          />
          <TextField
            autoComplete="off"
            error={!!errors.foreignTaxId}
            fullWidth
            helperText={errors.foreignTaxId?.message}
            label={tAttendance("withholding.foreignTaxId")}
            required
            slotProps={{ htmlInput: { maxLength: FOREIGN_TAX_ID_MAX_LENGTH } }}
            {...register("foreignTaxId")}
          />
        </>
      )}
    </FormBox>
  );
};

export default TaxIdentityDialog;
