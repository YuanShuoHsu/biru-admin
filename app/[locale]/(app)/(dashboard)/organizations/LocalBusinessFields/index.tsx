"use client";

import { useTranslations } from "next-intl";
import { type UseFormRegister } from "react-hook-form";

import { TextField } from "@mui/material";

import type { CreateOrganizationForm } from "../CreateOrganizationDialog/definitions";
import type { UpdateOrganizationForm } from "../UpdateOrganizationDialog/definitions";

type OrganizationForm = CreateOrganizationForm | UpdateOrganizationForm;

interface LocalBusinessFieldsProps {
  register: UseFormRegister<OrganizationForm>;
}

const LocalBusinessFields = ({ register }: LocalBusinessFieldsProps) => {
  const tOrganizations = useTranslations("organizations");

  return (
    <>
      <TextField
        fullWidth
        label={tOrganizations("localBusiness.openingHours.label")}
        placeholder={tOrganizations("localBusiness.openingHours.placeholder")}
        {...register("openingHours")}
      />
      <TextField
        fullWidth
        label={tOrganizations("localBusiness.telephone.label")}
        placeholder={tOrganizations("localBusiness.telephone.placeholder")}
        type="tel"
        {...register("telephone")}
      />
      <TextField
        fullWidth
        label={tOrganizations("localBusiness.hasMap.label")}
        placeholder={tOrganizations("localBusiness.hasMap.placeholder")}
        type="url"
        {...register("hasMap")}
      />
    </>
  );
};

export default LocalBusinessFields;
