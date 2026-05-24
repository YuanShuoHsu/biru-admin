"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  useWatch,
  type Control,
  type FieldError,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import CountrySelect from "@/components/CountrySelect";

import { countries, DEFAULT_COUNTRY_OPTION } from "@/constants/countries";

import { LocaleEnum } from "@/enums/Locale";

import { Stack, TextField } from "@mui/material";

import type { Organization } from "@/types/organizations";

import { getAddress, getPostalCode } from "@/utils/tw-postal-codes";

import type { CreateOrganizationForm } from "../CreateOrganizationDialog/definitions";
import type { UpdateOrganizationForm } from "../UpdateOrganizationDialog/definitions";

type OrganizationForm = CreateOrganizationForm | UpdateOrganizationForm;

type AddressFieldName = keyof Pick<
  Organization,
  | "addressCountry"
  | "addressLocality"
  | "addressRegion"
  | "extendedAddress"
  | "postalCode"
  | "streetAddress"
>;

interface AddressFieldsProps {
  control: Control<OrganizationForm>;
  errors: Partial<Record<AddressFieldName, FieldError>>;
  getValues: UseFormGetValues<OrganizationForm>;
  register: UseFormRegister<OrganizationForm>;
  setValue: UseFormSetValue<OrganizationForm>;
}

const AddressFields = ({
  control,
  errors,
  getValues,
  register,
  setValue,
}: AddressFieldsProps) => {
  const locale = useLocale();
  const isEnglish = locale === LocaleEnum.En;

  const tOrganizations = useTranslations("organizations");

  const [postalCode, addressRegion, addressLocality, addressCountry] = useWatch(
    {
      control,
      name: [
        "postalCode",
        "addressRegion",
        "addressLocality",
        "addressCountry",
      ],
    },
  );

  const isTaiwan = addressCountry === DEFAULT_COUNTRY_OPTION.code;

  const handlePostalCodeChange = (value: string) => {
    if (!isTaiwan) return;

    const address = getAddress(value);
    if (!address) return;

    setValue("addressRegion", address.region, { shouldDirty: true });
    setValue("addressLocality", address.locality, { shouldDirty: true });
  };

  const handleAddressRegionChange = (value: string) => {
    if (!isTaiwan) return;

    const locality = getValues("addressLocality");
    if (!locality) return;

    const postal = getPostalCode(value, locality);
    if (postal) setValue("postalCode", postal, { shouldDirty: true });
  };

  const handleAddressLocalityChange = (value: string) => {
    if (!isTaiwan) return;

    const region = getValues("addressRegion");
    if (!region) return;

    const postal = getPostalCode(region, value);
    if (postal) setValue("postalCode", postal, { shouldDirty: true });
  };

  return (
    <Stack
      width="100%"
      direction={isEnglish ? "column" : "column-reverse"}
      spacing={2}
    >
      <TextField
        autoComplete="address-line1"
        error={!!errors.streetAddress}
        fullWidth
        helperText={errors.streetAddress?.message}
        label={tOrganizations("address.streetAddress.label")}
        placeholder={tOrganizations("address.streetAddress.placeholder")}
        {...register("streetAddress")}
      />
      <TextField
        autoComplete="address-line2"
        error={!!errors.extendedAddress}
        fullWidth
        helperText={errors.extendedAddress?.message}
        label={tOrganizations("address.extendedAddress.label")}
        placeholder={tOrganizations("address.extendedAddress.placeholder")}
        {...register("extendedAddress")}
      />
      <Stack direction={isEnglish ? "row" : "row-reverse"} spacing={2}>
        <TextField
          autoComplete="address-level2"
          error={!!errors.addressLocality}
          fullWidth
          helperText={errors.addressLocality?.message}
          slotProps={{ inputLabel: { shrink: !!addressLocality } }}
          label={tOrganizations("address.addressLocality.label")}
          placeholder={tOrganizations("address.addressLocality.placeholder")}
          {...register("addressLocality", {
            onChange: (e) => handleAddressLocalityChange(e.target.value),
          })}
        />
        <TextField
          autoComplete="address-level1"
          error={!!errors.addressRegion}
          fullWidth
          helperText={errors.addressRegion?.message}
          slotProps={{ inputLabel: { shrink: !!addressRegion } }}
          label={tOrganizations("address.addressRegion.label")}
          placeholder={tOrganizations("address.addressRegion.placeholder")}
          {...register("addressRegion", {
            onChange: (e) => handleAddressRegionChange(e.target.value),
          })}
        />
      </Stack>
      <TextField
        autoComplete="postal-code"
        error={!!errors.postalCode}
        fullWidth
        helperText={errors.postalCode?.message}
        slotProps={{ inputLabel: { shrink: !!postalCode } }}
        label={tOrganizations("address.postalCode.label")}
        placeholder={tOrganizations("address.postalCode.placeholder")}
        {...register("postalCode", {
          onChange: (e) => handlePostalCodeChange(e.target.value),
        })}
      />
      <CountrySelect
        error={!!errors.addressCountry}
        helperText={errors.addressCountry?.message}
        label={tOrganizations("address.addressCountry.label")}
        value={
          countries.find(({ code }) => code === addressCountry) ||
          DEFAULT_COUNTRY_OPTION
        }
        {...register("addressCountry")}
      />
    </Stack>
  );
};

export default AddressFields;
