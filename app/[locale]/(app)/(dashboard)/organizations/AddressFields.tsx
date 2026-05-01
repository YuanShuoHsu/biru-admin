"use client";

import { useLocale, useTranslations } from "next-intl";
import type { FieldError, UseFormRegister } from "react-hook-form";

import type { CreateOrganizationForm } from "./CreateOrganizationDialog/definitions";
import type { UpdateOrganizationForm } from "./UpdateOrganizationDialog/definitions";

import { LocaleEnum } from "@/enums/Locale";

import { Box, TextField } from "@mui/material";

import type { Organization } from "@/types/organizations";

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
  errors: Partial<Record<AddressFieldName, FieldError>>;
  register: UseFormRegister<OrganizationForm>;
}

const AddressFields = ({ errors, register }: AddressFieldsProps) => {
  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");

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
        <TextField
          error={!!errors.addressCountry}
          fullWidth
          helperText={errors.addressCountry?.message}
          label={tOrganizations("address.addressCountry.label")}
          placeholder={tOrganizations("address.addressCountry.placeholder")}
          {...register("addressCountry")}
        />
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
      <TextField
        error={!!errors.addressCountry}
        fullWidth
        helperText={errors.addressCountry?.message}
        label={tOrganizations("address.addressCountry.label")}
        placeholder={tOrganizations("address.addressCountry.placeholder")}
        {...register("addressCountry")}
      />
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
