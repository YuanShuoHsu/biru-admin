"use client";

import { useTranslations } from "next-intl";

import { StyledTextField } from "@/components/OrganizationSelect";

const OrganizationSelectSkeleton = () => {
  const tCommon = useTranslations("common");

  return (
    <StyledTextField
      aria-busy
      disabled
      fullWidth
      label={tCommon("organization.label")}
      size="small"
      slotProps={{ inputLabel: { shrink: true } }}
      value=""
    />
  );
};

export default OrganizationSelectSkeleton;
