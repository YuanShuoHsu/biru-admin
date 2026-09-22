"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdateLocationDialog from "./UpdateLocationDialog";

import DetailsCard from "@/components/DetailsCard";
import LocationDetails, {
  hasLocationDetails,
} from "@/components/LocationDetails";

import { authClient } from "@/lib/auth-client";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization } from "@/types/organizations";

interface OrganizationsSlugLocationProps {
  activeOrganization: ActiveOrganization;
  canUpdateLocation: boolean;
}

const OrganizationsSlugLocation = ({
  activeOrganization: initialActiveOrganization,
  canUpdateLocation,
}: OrganizationsSlugLocationProps) => {
  const [organization, setOrganization] = useState(initialActiveOrganization);

  const { setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tOrganizations = useTranslations("organizations");

  const fetchOrganization = useCallback(async () => {
    const { data } = await authClient.organization.getFullOrganization({
      query: { organizationSlug: organization.slug },
    });

    if (data) setOrganization(data);
  }, [organization.slug]);

  const handleUpdateLocation = () => {
    setDialog({
      content: (
        <UpdateLocationDialog
          fetchOrganization={fetchOrganization}
          organization={organization}
        />
      ),
      formId: "update-location-form",
      open: true,
      title: tOrganizations("location.actions.updateLocation.title"),
    });
  };

  const hasLocation = hasLocationDetails(organization);

  return (
    <DetailsCard
      action={
        canUpdateLocation
          ? {
              label: tOrganizations("location.actions.updateLocation.title"),
              onClick: handleUpdateLocation,
            }
          : undefined
      }
      empty={hasLocation ? undefined : tCommon("location.empty")}
    >
      {hasLocation && <LocationDetails organization={organization} />}
    </DetailsCard>
  );
};

export default OrganizationsSlugLocation;
