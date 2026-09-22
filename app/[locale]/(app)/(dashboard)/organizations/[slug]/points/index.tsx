"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdatePointsDialog from "./UpdatePointsDialog";

import { authClient } from "@/lib/auth-client";

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

import type { ActiveOrganization } from "@/types/organizations";

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

  const format = useFormatter();

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

  return (
    <>
      {canUpdatePoints && (
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
          <Button
            onClick={handleUpdatePoints}
            size="small"
            startIcon={<Edit />}
            variant="contained"
          >
            {tOrganizations("points.actions.updatePoints.title")}
          </Button>
        </Stack>
      )}
      <Card variant="outlined">
        <StyledCardContent>
          <Grid container spacing={2}>
            <StyledGrid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography color="text.secondary" variant="body2">
                {tOrganizations("points.amountPerPoint.label")}
              </Typography>
              <Typography variant="body1">
                {organization.amountPerPoint != null
                  ? format.number(Number(organization.amountPerPoint))
                  : tOrganizations("points.disabled")}
              </Typography>
            </StyledGrid>
            <StyledGrid size={{ xs: 12, sm: 6, md: 4 }}>
              <Typography color="text.secondary" variant="body2">
                {tOrganizations("points.pointsValidityYears.label")}
              </Typography>
              <Typography variant="body1">
                {organization.pointsValidityYears != null
                  ? tOrganizations("points.validityYears", {
                      years: organization.pointsValidityYears,
                    })
                  : tOrganizations("points.perpetual")}
              </Typography>
            </StyledGrid>
          </Grid>
        </StyledCardContent>
      </Card>
    </>
  );
};

export default OrganizationsSlugPoints;
