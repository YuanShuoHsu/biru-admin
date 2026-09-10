"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdatePickupDialog from "./UpdatePickupDialog";

import { Edit } from "@mui/icons-material";
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
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
      <StyledPaper variant="outlined">
        <List dense disablePadding>
          {settings.map(({ key, value }) => (
            <ListItem disableGutters key={key}>
              <ListItemText
                primary={tOrganizations(`pickup.${key}.label`)}
                secondary={value}
              />
            </ListItem>
          ))}
        </List>
      </StyledPaper>
    </>
  );
};

export default OrganizationsSlugPickup;
