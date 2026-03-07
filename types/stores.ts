import type { Locale } from "@/i18n/routing";

export interface Store {
  id: string;
  name: Record<Locale, string>;
  createdAt: Date;
  isActive: boolean;
  slug: string;
  updatedAt: Date;
}

export type StoreSlug = Store["slug"];
export type StoreName = Store["name"][Locale];
