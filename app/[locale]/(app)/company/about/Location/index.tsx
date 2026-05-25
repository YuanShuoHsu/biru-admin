"use client";

import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";

import { type LocationForm, useLocationFormSchema } from "./definitions";

import GradientBox from "@/components/GradientBox";

import { countries } from "@/constants/countries";

import { LocaleEnum } from "@/enums/Locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { useOrganizations } from "@/hooks/organizations";

import { AccessTime, LocationOn, Phone } from "@mui/icons-material";
import {
  Box,
  Container,
  type ContainerProps,
  Link,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { formatOpeningHoursForDisplay } from "@/utils/openingHours";

const StyledContainer = styled(Container)<ContainerProps>(({ theme }) => ({
  padding: theme.spacing(5, 2),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
}));

const StyledOrganizationSelect = styled(TextField)({
  maxWidth: 240,
});

const StyledIframe = styled("iframe")(({ theme }) => ({
  width: "100%",
  height: theme.spacing(56.25),
  borderRadius: theme.shape.borderRadius,
}));

const Location = () => {
  const organizations = useOrganizations();
  const defaultOrganizationId = organizations[0]?.id || "";

  const locationFormSchema = useLocationFormSchema();
  const { control, register } = useForm<LocationForm>({
    values: { organizationId: defaultOrganizationId },
    resolver: zodResolver(locationFormSchema),
  });
  const selectedOrganizationId = useWatch({ control, name: "organizationId" });

  const organization = organizations.find(
    ({ id }) => id === selectedOrganizationId,
  );

  const mapUrl = (() => {
    if (!organization?.hasMap) return null;
    const cidMatch = organization.hasMap.match(
      /!1s(0x[0-9a-f]+)%3A(0x[0-9a-f]+)/i,
    );
    if (cidMatch)
      return `https://www.google.com/maps?cid=${BigInt(cidMatch[2]).toString()}`;
    return organization.hasMap.replace("/maps/embed?", "/maps?");
  })();

  const countryLabel =
    countries.find(({ code }) => code === organization?.addressCountry)
      ?.label || organization?.addressCountry;

  const locale = useLocale();

  const addressGroups = [
    [organization?.streetAddress, organization?.extendedAddress],
    [organization?.addressLocality],
    [organization?.addressRegion],
    [organization?.postalCode],
    [countryLabel],
  ];

  const address = (
    locale === LocaleEnum.En ? addressGroups : [...addressGroups].reverse()
  )
    .flat()
    .filter(Boolean)
    .join(", ");

  const tCommon = useTranslations("common");
  const tCompanyAboutLocation = useTranslations("company.about.location");

  return (
    <Box bgcolor="background.paper" component="section">
      <StyledContainer disableGutters maxWidth="lg">
        <Stack gap={1}>
          <Typography
            color="primary.main"
            component="h2"
            fontWeight="bold"
            variant="body2"
          >
            {tCompanyAboutLocation("label")}
          </Typography>
          <Typography
            color="text.primary"
            component="h2"
            fontWeight="bold"
            variant="h5"
          >
            {tCompanyAboutLocation("titlePrefix")}
            <GradientBox component="span">
              {tCompanyAboutLocation("titleHighlight")}
            </GradientBox>
          </Typography>
        </Stack>
        <Stack gap={2}>
          <StyledOrganizationSelect
            label={tCompanyAboutLocation("selectOrganization.label")}
            select
            size="small"
            slotProps={{
              inputLabel: { shrink: true },
              select: {
                displayEmpty: true,
                renderValue: (selected) => {
                  const org = organizations.find(({ id }) => id === selected);

                  return org ? (
                    org.name
                  ) : (
                    <em>
                      {tCompanyAboutLocation("selectOrganization.placeholder")}
                    </em>
                  );
                },
              },
            }}
            value={selectedOrganizationId}
            {...register("organizationId")}
          >
            <MenuItem disabled value="">
              <em>{tCompanyAboutLocation("selectOrganization.placeholder")}</em>
            </MenuItem>
            {organizations.map(({ id, name }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </StyledOrganizationSelect>
          {address && (
            <Stack direction="row" gap={1}>
              <LocationOn color="primary" fontSize="small" />
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
          {organization?.openingHours && (
            <Stack direction="row" gap={1}>
              <AccessTime color="primary" fontSize="small" />
              <Stack gap={1}>
                {formatOpeningHoursForDisplay(organization.openingHours, {
                  formatDay: (day) =>
                    tCompanyAboutLocation(`openingHours.${day}`),
                  rangeSeparator: tCompanyAboutLocation(
                    "openingHours.rangeSeparator",
                  ),
                  delimiter: tCommon("delimiter"),
                }).map((line, index) => (
                  <Typography
                    color="text.secondary"
                    key={index}
                    variant="body2"
                  >
                    {line}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          )}
          {organization?.telephone && (
            <Stack direction="row" gap={1}>
              <Phone color="primary" fontSize="small" />
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
          {organization?.hasMap && (
            <StyledIframe
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={organization.hasMap}
              title={tCompanyAboutLocation("label")}
            />
          )}
        </Stack>
      </StyledContainer>
    </Box>
  );
};

export default Location;
