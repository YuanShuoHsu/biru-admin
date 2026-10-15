import {
  adminClient,
  inferAdditionalFields,
  multiSessionClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, admin, member, owner } from "./permissions";

import { routing } from "@/i18n/routing";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_ADMIN_URL,
  fetchOptions: {
    onRequest: ({ headers }) => {
      if (typeof document !== "undefined" && !headers.has("Accept-Language"))
        headers.set("Accept-Language", document.documentElement.lang);
    },
  },
  plugins: [
    adminClient(),
    inferAdditionalFields({
      user: {
        bio: {
          type: "string",
          required: false,
        },
        birthDate: {
          type: "date",
          required: false,
        },
        emailSubscribed: {
          type: "boolean",
          required: true,
          defaultValue: true,
        },
        firstName: {
          type: "string",
          required: true,
        },
        lang: {
          type: [...routing.locales],
          required: true,
          defaultValue: routing.defaultLocale,
        },
        lastName: {
          type: "string",
          required: false,
        },
        phoneNumber: {
          type: "string",
          required: false,
        },
        phoneNumberVerified: {
          type: "boolean",
          required: true,
          defaultValue: false,
          input: false,
        },
      },
    }),
    multiSessionClient(),
    organizationClient({
      ac,
      roles: { owner, admin, member },
      teams: { enabled: true },
      schema: {
        organization: {
          additionalFields: {
            // https://schema.org/PostalAddress
            addressCountry: {
              type: "string",
              required: false,
            },
            addressLocality: { type: "string", required: false },
            addressRegion: { type: "string", required: false },
            extendedAddress: { type: "string", required: false },
            postOfficeBoxNumber: { type: "string", required: false },
            postalCode: { type: "string", required: false },
            streetAddress: { type: "string", required: false },

            // https://schema.org/LocalBusiness
            hasMap: { type: "string", required: false },
            openingHours: { type: "string", required: false },
            telephone: { type: "string", required: false },

            currency: { type: "string", required: false },

            amountPerPoint: { type: "number", required: false },
            pointsEnabledAt: { type: "date", required: false },
            closedAt: { type: "date", required: false, input: false },
            pointsValidityYears: { type: "number", required: false },

            pickupLeadMinutes: { type: "number", required: false },
            pickupMaxAdvanceDays: { type: "number", required: false },
            pickupCutoffMinutes: { type: "number", required: false },
          },
        },
      },
    }),
  ],
});
