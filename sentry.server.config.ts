// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

import * as Sentry from "@sentry/nextjs";

import { SENTRY_OPTIONS } from "@/constants/sentry";

if (SENTRY_OPTIONS.dsn) Sentry.init(SENTRY_OPTIONS);
