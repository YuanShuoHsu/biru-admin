// https://next-intl.dev/docs/workflows/typescript

import { formats } from "@/i18n/request";
import { routing } from "@/i18n/routing";

import messages from "@/messages";

declare module "next-intl" {
  interface AppConfig {
    Formats: typeof formats;
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
