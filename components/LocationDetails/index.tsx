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
import { styled, type Theme } from "@mui/material/styles";

import type { OrganizationResponse } from "@/types/organizations";

import { formatOpeningHoursForDisplay } from "@/utils/openingHours";

const InfoRowStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const iconStyle = ({ theme }: { theme: Theme }) => ({
  marginTop: theme.spacing(0.25),
});

const StyledLocationOn = styled(LocationOn)(iconStyle);

const StyledAccessTime = styled(AccessTime)(iconStyle);

const HoursStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(0.5),
}));

const StyledPhone = styled(Phone)(iconStyle);

const StyledIframe = styled("iframe")(({ theme }) => ({
  width: "100%",
  height: theme.spacing(56.25),
  borderRadius: theme.shape.borderRadius,
}));

type LocationOrganization = Pick<
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

export const hasLocationDetails = (organization?: LocationOrganization) =>
  Boolean(
    organization?.streetAddress ||
      organization?.extendedAddress ||
      organization?.addressLocality ||
      organization?.addressRegion ||
      organization?.postalCode ||
      organization?.addressCountry ||
      organization?.openingHours ||
      organization?.telephone ||
      organization?.hasMap,
  );

interface LocationDetailsProps {
  organization?: LocationOrganization;
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

  const hasContent = hasLocationDetails(organization);

  return (
    <>
      {!hasContent && (
        <Typography color="textSecondary" variant="body2">
          {tCommon("location.empty")}
        </Typography>
      )}
      {address && (
        <InfoRowStack direction="row">
          <StyledLocationOn color="primary" fontSize="small" />
          <Typography color="textSecondary" variant="body2">
            {mapUrl ? (
              <Link
                color="textSecondary"
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
        </InfoRowStack>
      )}
      {organization?.openingHours && (
        <InfoRowStack direction="row">
          <StyledAccessTime color="primary" fontSize="small" />
          <HoursStack>
            {formatOpeningHoursForDisplay(organization.openingHours, {
              formatDay: (day) => tCommon(`location.openingHours.${day}`),
              formatNextDayTime: (time) =>
                tCommon("location.openingHours.nextDayTime", { time }),
              allDayLabel: tCommon("location.openingHours.allDay"),
              rangeSeparator: tCommon("location.openingHours.rangeSeparator"),
              delimiter: tCommon("delimiter"),
            }).map((line, index) => (
              <Typography color="textSecondary" key={index} variant="body2">
                {line}
              </Typography>
            ))}
          </HoursStack>
        </InfoRowStack>
      )}
      {organization?.telephone && (
        <InfoRowStack direction="row">
          <StyledPhone color="primary" fontSize="small" />
          <Typography color="textSecondary" variant="body2">
            <Link
              color="textSecondary"
              href={phoneNumber?.getURI() || `tel:${organization.telephone}`}
              underline="hover"
            >
              {phoneNumber?.formatInternational() || organization.telephone}
            </Link>
          </Typography>
        </InfoRowStack>
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
