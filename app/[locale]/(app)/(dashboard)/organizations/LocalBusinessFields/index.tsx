"use client";

import { useTranslations } from "next-intl";
import {
  useWatch,
  type Control,
  type FieldError,
  type UseFormRegister,
} from "react-hook-form";

import TextMaskCustom from "@/components/TextMaskCustom";

import { TextField } from "@mui/material";

import type { Organization } from "@/types/organizations";

import type { CreateOrganizationForm } from "../CreateOrganizationDialog/definitions";
import type { UpdateOrganizationForm } from "../UpdateOrganizationDialog/definitions";

type OrganizationForm = CreateOrganizationForm | UpdateOrganizationForm;

type LocalBusinessFieldName = keyof Pick<
  Organization,
  "openingHours" | "telephone" | "hasMap"
>;

interface LocalBusinessFieldsProps {
  control: Control<OrganizationForm>;
  errors: Partial<Record<LocalBusinessFieldName, FieldError>>;
  register: UseFormRegister<OrganizationForm>;
}

const LocalBusinessFields = ({
  control,
  errors,
  register,
}: LocalBusinessFieldsProps) => {
  const tOrganizations = useTranslations("organizations");

  const addressCountry = useWatch({ control, name: "addressCountry" });
  const telephone = useWatch({ control, name: "telephone" });

  return (
    <>
      <TextField
        error={!!errors.openingHours}
        fullWidth
        helperText={errors.openingHours?.message}
        label={tOrganizations("localBusiness.openingHours.label")}
        placeholder={tOrganizations("localBusiness.openingHours.placeholder")}
        {...register("openingHours")}
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
