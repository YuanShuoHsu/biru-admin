"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Controller,
  type Control,
  type FieldError,
  type UseFormRegister,
} from "react-hook-form";

import CountrySelect from "@/components/CountrySelect";

import { COUNTRY_OPTIONS, DEFAULT_COUNTRY_OPTION } from "@/constants/countries";

import { LocaleEnum } from "@/enums/Locale";

import { Box, TextField } from "@mui/material";

import type { Organization } from "@/types/organizations";

import type { CreateOrganizationForm } from "../CreateOrganizationDialog/definitions";
import type { UpdateOrganizationForm } from "../UpdateOrganizationDialog/definitions";

type AddressFieldName = keyof Pick<
  Organization,
  | "addressCountry"
  | "addressLocality"
  | "addressRegion"
  | "extendedAddress"
  | "postOfficeBoxNumber"
  | "postalCode"
  | "streetAddress"
>;

type OrganizationForm = CreateOrganizationForm | UpdateOrganizationForm;

interface AddressFieldsProps {
  control: Control<OrganizationForm>;
  errors: Partial<Record<AddressFieldName, FieldError>>;
  register: UseFormRegister<OrganizationForm>;
}

const AddressFields = ({ control, errors, register }: AddressFieldsProps) => {
  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");

  const countrySelect = (
    <Controller
      control={control}
      name="addressCountry"
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <CountrySelect
          error={!!error}
          helperText={error?.message}
          label={tOrganizations("address.addressCountry.label")}
          onChange={({ code }) => onChange(code)}
          value={
            COUNTRY_OPTIONS.find(({ code }) => code === value) ||
            DEFAULT_COUNTRY_OPTION
          }
        />
      )}
    />
  );

  return locale === LocaleEnum.En ? (
    <>
      <TextField
        error={!!errors.streetAddress}
        fullWidth
        helperText={errors.streetAddress?.message}
        label={tOrganizations("address.streetAddress.label")}
        placeholder={tOrganizations("address.streetAddress.placeholder")}
        {...register("streetAddress")}
      />
      <TextField
        error={!!errors.extendedAddress}
        fullWidth
        helperText={errors.extendedAddress?.message}
        label={tOrganizations("address.extendedAddress.label")}
        placeholder={tOrganizations("address.extendedAddress.placeholder")}
        {...register("extendedAddress")}
      />
      <Box display="flex" gap={2} width="100%">
        <TextField
          error={!!errors.postalCode}
          fullWidth
          helperText={errors.postalCode?.message}
          label={tOrganizations("address.postalCode.label")}
          placeholder={tOrganizations("address.postalCode.placeholder")}
          {...register("postalCode")}
        />
        <TextField
          error={!!errors.addressLocality}
          fullWidth
          helperText={errors.addressLocality?.message}
          label={tOrganizations("address.addressLocality.label")}
          placeholder={tOrganizations("address.addressLocality.placeholder")}
          {...register("addressLocality")}
        />
      </Box>
      <Box display="flex" gap={2} width="100%">
        <TextField
          error={!!errors.addressRegion}
          fullWidth
          helperText={errors.addressRegion?.message}
          label={tOrganizations("address.addressRegion.label")}
          placeholder={tOrganizations("address.addressRegion.placeholder")}
          {...register("addressRegion")}
        />
        {countrySelect}
      </Box>
      <TextField
        error={!!errors.postOfficeBoxNumber}
        fullWidth
        helperText={errors.postOfficeBoxNumber?.message}
        label={tOrganizations("address.postOfficeBoxNumber.label")}
        placeholder={tOrganizations("address.postOfficeBoxNumber.placeholder")}
        {...register("postOfficeBoxNumber")}
      />
    </>
  ) : (
    <>
      {countrySelect}
      <Box display="flex" gap={2} width="100%">
        <TextField
          error={!!errors.addressRegion}
          fullWidth
          helperText={errors.addressRegion?.message}
          label={tOrganizations("address.addressRegion.label")}
          placeholder={tOrganizations("address.addressRegion.placeholder")}
          {...register("addressRegion")}
        />
        <TextField
          error={!!errors.addressLocality}
          fullWidth
          helperText={errors.addressLocality?.message}
          label={tOrganizations("address.addressLocality.label")}
          placeholder={tOrganizations("address.addressLocality.placeholder")}
          {...register("addressLocality")}
        />
      </Box>
      <TextField
        error={!!errors.postalCode}
        fullWidth
        helperText={errors.postalCode?.message}
        label={tOrganizations("address.postalCode.label")}
        placeholder={tOrganizations("address.postalCode.placeholder")}
        {...register("postalCode")}
      />
      <TextField
        error={!!errors.streetAddress}
        fullWidth
        helperText={errors.streetAddress?.message}
        label={tOrganizations("address.streetAddress.label")}
        placeholder={tOrganizations("address.streetAddress.placeholder")}
        {...register("streetAddress")}
      />
      <TextField
        error={!!errors.extendedAddress}
        fullWidth
        helperText={errors.extendedAddress?.message}
        label={tOrganizations("address.extendedAddress.label")}
        placeholder={tOrganizations("address.extendedAddress.placeholder")}
        {...register("extendedAddress")}
      />
      <TextField
        error={!!errors.postOfficeBoxNumber}
        fullWidth
        helperText={errors.postOfficeBoxNumber?.message}
        label={tOrganizations("address.postOfficeBoxNumber.label")}
        placeholder={tOrganizations("address.postOfficeBoxNumber.placeholder")}
        {...register("postOfficeBoxNumber")}
      />
    </>
  );
};

export default AddressFields;
