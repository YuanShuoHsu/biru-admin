"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdatePickupDialog from "./UpdatePickupDialog";

import { Edit } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

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

  const settings = [
    {
      key: "pickupLeadMinutes",
      value: tOrganizations("pickup.minutes", {
        minutes: organization.pickupLeadMinutes,
      }),
    },
    {
      key: "pickupMaxAdvanceDays",
      value: tOrganizations("pickup.days", {
        days: organization.pickupMaxAdvanceDays,
      }),
    },
    {
      key: "pickupCutoffMinutes",
      value: tOrganizations("pickup.minutes", {
        minutes: organization.pickupCutoffMinutes,
      }),
    },
  ] as const;

  return (
    <>
      {canUpdatePickup && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          <Button
            onClick={handleUpdatePickup}
            size="small"
            startIcon={<Edit />}
            variant="contained"
          >
            {tOrganizations("pickup.actions.updatePickup.title")}
          </Button>
        </Stack>
      )}
      <Card variant="outlined">
        <StyledCardContent>
          <Grid container spacing={2}>
            {settings.map(({ key, value }) => (
              <StyledGrid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography color="text.secondary" variant="body2">
                  {tOrganizations(`pickup.${key}.label`)}
                </Typography>
                <Typography variant="body1">{value}</Typography>
              </StyledGrid>
            ))}
          </Grid>
        </StyledCardContent>
      </Card>
    </>
  );
};

export default OrganizationsSlugPickup;
