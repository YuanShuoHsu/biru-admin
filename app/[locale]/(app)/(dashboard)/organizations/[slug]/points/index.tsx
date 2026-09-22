"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdatePointsDialog from "./UpdatePointsDialog";

import DetailsCard from "@/components/DetailsCard";

import { authClient } from "@/lib/auth-client";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization } from "@/types/organizations";

const SETTING_KEYS = [
  "amountPerPoint",
  "pointsValidityYears",
] as const satisfies readonly (keyof ActiveOrganization)[];

interface OrganizationsSlugPointsProps {
  activeOrganization: ActiveOrganization;
  canUpdatePoints: boolean;
}

const OrganizationsSlugPoints = ({
  activeOrganization: initialActiveOrganization,
  canUpdatePoints,
}: OrganizationsSlugPointsProps) => {
  const [organization, setOrganization] = useState(initialActiveOrganization);

  const { setDialog } = useDialogStore((state) => state);

  const tOrganizations = useTranslations("organizations");

  const fetchOrganization = useCallback(async () => {
    const { data } = await authClient.organization.getFullOrganization({
      query: { organizationSlug: organization.slug },
    });

    if (data) setOrganization(data);
  }, [organization.slug]);

  const handleUpdatePoints = () => {
    setDialog({
      content: (
        <UpdatePointsDialog
          fetchOrganization={fetchOrganization}
          organization={organization}
        />
      ),
      formId: "update-points-form",
      open: true,
      title: tOrganizations("points.actions.updatePoints.title"),
    });
  };

  const items = SETTING_KEYS.map((key) => {
    const value = organization[key];

    return {
      key,
      label: tOrganizations(`points.${key}.label`),
      value:
        value != null
          ? tOrganizations(`points.${key}.value`, { value: Number(value) })
          : tOrganizations(`points.${key}.empty`),
    };
  });

  return (
    <DetailsCard
      action={
        canUpdatePoints
          ? {
              label: tOrganizations("points.actions.updatePoints.title"),
              onClick: handleUpdatePoints,
            }
          : undefined
      }
      items={items}
    />
  );
};

export default OrganizationsSlugPoints;
