"use client";

import {
  type CountryCode,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { useLocale, useTranslations } from "next-intl";

import { countries } from "@/constants/countries";

import { LocaleEnum } from "@/enums/Locale";

import { AccessTime, LocationOn, Phone } from "@mui/icons-material";
import { Link, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { OrganizationResponse } from "@/types/organizations";

import { formatOpeningHoursForDisplay } from "@/utils/openingHours";

const StyledIframe = styled("iframe")(({ theme }) => ({
  width: "100%",
  height: theme.spacing(56.25),
  borderRadius: theme.shape.borderRadius,
}));

interface LocationDetailsProps {
  organization?: Pick<
    OrganizationResponse,
    | "addressCountry"
    | "addressLocality"
    | "addressRegion"
    | "extendedAddress"
    | "hasMap"
    | "name"
    | "openingHours"
    | "postalCode"
    | "streetAddress"
    | "telephone"
  >;
  showMap?: boolean;
}

const LocationDetails = ({
  organization,
  showMap = true,
}: LocationDetailsProps) => {
  const locale = useLocale();

  const tCommon = useTranslations("common");

  const countryLabel =
    countries.find(({ code }) => code === organization?.addressCountry)
      ?.label || organization?.addressCountry;

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

  const mapUrl = (() => {
    if (!organization?.hasMap) return null;
    const cidMatch = organization.hasMap.match(
      /!1s(0x[0-9a-f]+)%3A(0x[0-9a-f]+)/i,
    );
    if (cidMatch)
      return `https://www.google.com/maps?cid=${BigInt(cidMatch[2]).toString()}`;
    return organization.hasMap.replace("/maps/embed?", "/maps?");
  })();

  const phoneNumber =
    organization?.telephone && organization?.addressCountry
      ? parsePhoneNumberFromString(
          organization.telephone,
          organization.addressCountry as CountryCode,
        )
      : undefined;

  const hasContent =
    address ||
    organization?.openingHours ||
    organization?.telephone ||
    organization?.hasMap;

  return (
    <>
      {!hasContent && (
        <Typography color="text.secondary" variant="body2">
          {tCommon("location.empty")}
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
      {organization?.openingHours && (
        <Stack direction="row" gap={1}>
          <AccessTime color="primary" fontSize="small" sx={{ mt: 0.25 }} />
          <Stack gap={0.5}>
            {formatOpeningHoursForDisplay(organization.openingHours, {
              formatDay: (day) => tCommon(`location.openingHours.${day}`),
              formatNextDayTime: (time) =>
                tCommon("location.openingHours.nextDayTime", { time }),
              allDayLabel: tCommon("location.openingHours.allDay"),
              rangeSeparator: tCommon("location.openingHours.rangeSeparator"),
              delimiter: tCommon("delimiter"),
            }).map((line, index) => (
              <Typography color="text.secondary" key={index} variant="body2">
                {line}
              </Typography>
            ))}
          </Stack>
        </Stack>
      )}
      {organization?.telephone && (
        <Stack direction="row" gap={1}>
          <Phone color="primary" fontSize="small" sx={{ mt: 0.25 }} />
          <Typography color="text.secondary" variant="body2">
            <Link
              color="text.secondary"
              href={phoneNumber?.getURI() || `tel:${organization.telephone}`}
              underline="hover"
            >
              {phoneNumber?.formatInternational() || organization.telephone}
            </Link>
          </Typography>
        </Stack>
      )}
      {showMap && organization?.hasMap && (
        <StyledIframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={organization.hasMap}
          title={organization.name}
        />
      )}
    </>
  );
};

export default LocationDetails;
