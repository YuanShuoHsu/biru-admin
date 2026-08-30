"use client";

import { useTranslations } from "next-intl";
import {
  useWatch,
  type Control,
  type FieldError,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import OpeningHoursField from "@/components/OpeningHoursField";

import TextMaskCustom from "@/components/TextMaskCustom";

import { TextField } from "@mui/material";

import { getPhoneFormatting } from "@/utils/countries";

import type { Organization } from "@/types/organizations";

import type { UpdateLocationForm } from "../[slug]/location/UpdateLocationDialog/definitions";

type OrganizationForm = UpdateLocationForm;

type LocalBusinessFieldName = keyof Pick<
  Organization,
  "openingHours" | "telephone" | "hasMap"
>;

interface LocalBusinessFieldsProps {
  control: Control<OrganizationForm>;
  errors: Partial<Record<LocalBusinessFieldName, FieldError>>;
  register: UseFormRegister<OrganizationForm>;
  setValue: UseFormSetValue<OrganizationForm>;
}

const LocalBusinessFields = ({
  control,
  errors,
  register,
  setValue,
}: LocalBusinessFieldsProps) => {
  const tCommon = useTranslations("common");
  const tOrganizations = useTranslations("organizations");

  const addressCountry = useWatch({ control, name: "addressCountry" });
  const openingHours = useWatch({ control, name: "openingHours" });
  const telephone = useWatch({ control, name: "telephone" });

  const { mask, placeholder } = getPhoneFormatting(addressCountry);

  return (
    <>
      <OpeningHoursField
        error={!!errors.openingHours}
        fullWidth
        label={tOrganizations("localBusiness.openingHours.label")}
        onChange={(value) => setValue("openingHours", value)}
        value={openingHours}
      />
      <TextField
        autoComplete="tel"
        error={!!errors.telephone}
        fullWidth
        helperText={errors.telephone?.message}
        label={`${tOrganizations("localBusiness.telephone.label")} ${tCommon("optional")}`}
        slotProps={{
          input: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inputComponent: TextMaskCustom as any,
            inputProps: { mask, placeholder },
          },
        }}
        type="tel"
        value={telephone}
        {...register("telephone")}
      />
      <TextField
        error={!!errors.hasMap}
        fullWidth
        helperText={errors.hasMap?.message}
        label={`${tOrganizations("localBusiness.hasMap.label")} ${tCommon("optional")}`}
        placeholder={tOrganizations("localBusiness.hasMap.placeholder")}
        type="url"
        {...register("hasMap")}
      />
    </>
  );
};

export default LocalBusinessFields;
