"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdateLocationDialog from "./UpdateLocationDialog";

import LocationDetails from "@/components/LocationDetails";

import { authClient } from "@/lib/auth-client";

import { Edit } from "@mui/icons-material";
import { Button, Paper, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization } from "@/types/organizations";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

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

  return (
    <>
      {canUpdateLocation && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          <Button
            onClick={handleUpdateLocation}
            size="small"
            startIcon={<Edit />}
            variant="contained"
          >
            {tOrganizations("location.actions.updateLocation.title")}
          </Button>
        </Stack>
      )}
      <StyledPaper variant="outlined">
        <LocationDetails organization={organization} />
      </StyledPaper>
    </>
  );
};

export default OrganizationsSlugLocation;
