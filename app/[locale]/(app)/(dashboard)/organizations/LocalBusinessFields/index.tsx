"use client";

import { useTranslations } from "next-intl";
import {
  useWatch,
  type Control,
  type FieldError,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import TextMaskCustom from "@/components/TextMaskCustom";

import { TextField } from "@mui/material";

import type { Organization } from "@/types/organizations";

import type { CreateOrganizationForm } from "../CreateOrganizationDialog/definitions";
import type { UpdateOrganizationForm } from "../UpdateOrganizationDialog/definitions";
import OpeningHoursField from "./OpeningHoursField";

type OrganizationForm = CreateOrganizationForm | UpdateOrganizationForm;

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
  const tOrganizations = useTranslations("organizations");

  const addressCountry = useWatch({ control, name: "addressCountry" });
  const openingHours = useWatch({ control, name: "openingHours" });
  const telephone = useWatch({ control, name: "telephone" });

  return (
    <>
      <OpeningHoursField
        error={!!errors.openingHours}
        onChange={(val) => setValue("openingHours", val)}
        value={openingHours}
      />
      <TextField
        autoComplete="tel"
        error={!!errors.telephone}
        fullWidth
        helperText={errors.telephone?.message}
        label={tOrganizations("localBusiness.telephone.label")}
        slotProps={{
          input: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inputComponent: TextMaskCustom as any,
            inputProps: { countryCode: addressCountry },
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
        label={tOrganizations("localBusiness.hasMap.label")}
        placeholder={tOrganizations("localBusiness.hasMap.placeholder")}
        type="url"
        {...register("hasMap")}
      />
    </>
  );
};

export default LocalBusinessFields;
