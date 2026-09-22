"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdatePickupDialog from "./UpdatePickupDialog";

import DetailsCard from "@/components/DetailsCard";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const SETTING_KEYS = [
  "pickupLeadMinutes",
  "pickupMaxAdvanceDays",
  "pickupCutoffMinutes",
] as const satisfies readonly (keyof OrganizationResponse)[];

interface OrganizationsSlugPickupProps {
  canUpdatePickup: boolean;
  organization: OrganizationResponse;
}

const OrganizationsSlugPickup = ({
  canUpdatePickup,
  organization: initialOrganization,
}: OrganizationsSlugPickupProps) => {
  const [organization, setOrganization] = useState(initialOrganization);

  const { setDialog } = useDialogStore((state) => state);

  const tOrganizations = useTranslations("organizations");

  const fetchOrganization = useCallback(async () => {
    const data = await fetcher<OrganizationResponse>(
      `/api/organizations/${organization.slug}`,
    );

    setOrganization(data);
  }, [organization.slug]);

  const handleUpdatePickup = () => {
    setDialog({
      content: (
        <UpdatePickupDialog
          fetchOrganization={fetchOrganization}
          organization={organization}
        />
      ),
      formId: "update-pickup-form",
      open: true,
      title: tOrganizations("pickup.actions.updatePickup.title"),
    });
  };

  const items = SETTING_KEYS.map((key) => ({
    key,
    label: tOrganizations(`pickup.${key}.label`),
    value: tOrganizations(`pickup.${key}.value`, { value: organization[key] }),
  }));

  return (
    <DetailsCard
      action={
        canUpdatePickup
          ? {
              label: tOrganizations("pickup.actions.updatePickup.title"),
              onClick: handleUpdatePickup,
            }
          : undefined
      }
      items={items}
    />
  );
};

export default OrganizationsSlugPickup;
