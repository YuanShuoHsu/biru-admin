"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import UpdateLocationDialog from "./UpdateLocationDialog";

import { countries } from "@/constants/countries";

import { LocaleEnum } from "@/enums/Locale";

import { authClient } from "@/lib/auth-client";

import { AccessTime, Edit, LocationOn, Phone } from "@mui/icons-material";
import { Button, Link, Paper, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ActiveOrganization } from "@/types/organizations";

import { formatOpeningHoursForDisplay } from "@/utils/openingHours";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledIframe = styled("iframe")(({ theme }) => ({
  width: "100%",
  height: theme.spacing(56.25),
  borderRadius: theme.shape.borderRadius,
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

  const locale = useLocale();

  const tOrganizations = useTranslations("organizations");
  const tCommon = useTranslations("common");

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

  const countryLabel =
    countries.find(({ code }) => code === organization.addressCountry)?.label ||
    organization.addressCountry;

  const addressGroups = [
    [organization.streetAddress, organization.extendedAddress],
    [organization.addressLocality],
    [organization.addressRegion],
    [organization.postalCode],
    [countryLabel],
  ];

  const address = (
    locale === LocaleEnum.En ? addressGroups : [...addressGroups].reverse()
  )
    .flat()
    .filter(Boolean)
    .join(", ");

  const mapUrl = (() => {
    if (!organization.hasMap) return null;
    const cidMatch = organization.hasMap.match(
      /!1s(0x[0-9a-f]+)%3A(0x[0-9a-f]+)/i,
    );
    if (cidMatch)
      return `https://www.google.com/maps?cid=${BigInt(cidMatch[2]).toString()}`;
    return organization.hasMap.replace("/maps/embed?", "/maps?");
  })();

  const hasContent =
    address ||
    organization.openingHours ||
    organization.telephone ||
    organization.hasMap;

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        {canUpdateLocation && (
          <Button
            onClick={handleUpdateLocation}
            size="small"
            startIcon={<Edit />}
            variant="contained"
          >
            {tOrganizations("location.actions.updateLocation.title")}
          </Button>
        )}
      </Stack>
      <StyledPaper variant="outlined">
        {!hasContent && (
          <Typography color="text.secondary" variant="body2">
            {tOrganizations("location.empty")}
          </Typography>
        )}
        {address && (
          <Stack direction="row" gap={1}>
            <LocationOn color="primary" fontSize="small" sx={{ mt: 0.25 }} />
            <Typography color="text.secondary" variant="body2">
              {mapUrl ? (
                <Link
                  color="text.secondary"
                  href={mapUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  underline="hover"
                >
                  {address}
                </Link>
              ) : (
                address
              )}
            </Typography>
          </Stack>
        )}
        {organization.openingHours && (
          <Stack direction="row" gap={1}>
            <AccessTime color="primary" fontSize="small" sx={{ mt: 0.25 }} />
            <Stack gap={0.5}>
              {formatOpeningHoursForDisplay(organization.openingHours, {
                formatDay: (day) =>
                  tOrganizations(`location.openingHours.${day}`),
                rangeSeparator: tOrganizations(
                  "location.openingHours.rangeSeparator",
                ),
                delimiter: tCommon("delimiter"),
              }).map((line, index) => (
                <Typography color="text.secondary" key={index} variant="body2">
                  {line}
                </Typography>
              ))}
            </Stack>
          </Stack>
        )}
        {organization.telephone && (
          <Stack direction="row" gap={1}>
            <Phone color="primary" fontSize="small" sx={{ mt: 0.25 }} />
            <Typography color="text.secondary" variant="body2">
              <Link
                color="text.secondary"
                href={`tel:${organization.telephone}`}
                underline="hover"
              >
                {organization.telephone}
              </Link>
            </Typography>
          </Stack>
        )}
        {organization.hasMap && (
          <StyledIframe
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={organization.hasMap}
            title={organization.name}
          />
        )}
      </StyledPaper>
    </>
  );
};

export default OrganizationsSlugLocation;
