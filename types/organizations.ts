import { authClient } from "@/lib/auth-client";

import type { components } from "@/types/api";

export type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization;
export type Invitation = typeof authClient.$Infer.Invitation;
export type Member = typeof authClient.$Infer.Member;
export type Organization = typeof authClient.$Infer.Organization;
export type Team = typeof authClient.$Infer.Team;

export type CreateSpecialHoursDto =
  components["schemas"]["CreateSpecialHoursDto"];
export type InvoicePrinterSetting =
  components["schemas"]["InvoicePrinterSettingDto"];
export type InvoicePrinterStatus =
  components["schemas"]["InvoicePrinterStatusDto"];
export type MyOrganization = components["schemas"]["MyOrganizationListItemDto"];
export type OrganizationResponse =
  components["schemas"]["OrganizationResponseDto"];
export type OrganizationStats =
  components["schemas"]["OrganizationStatsResponseDto"];
export type Printer = components["schemas"]["PrinterDto"];
export type PrinterCredentials = components["schemas"]["PrinterCredentialsDto"];
export type ProcessSpecialHoursAffectedDto =
  components["schemas"]["ProcessSpecialHoursAffectedDto"];
export type SpecialHours = components["schemas"]["SpecialHoursDto"];
export type SpecialHoursAffected =
  components["schemas"]["SpecialHoursAffectedDto"];
export type SpecialHoursAffectedOrder =
  components["schemas"]["SpecialHoursAffectedOrderDto"];
export type SpecialHoursProcessResponse =
  components["schemas"]["SpecialHoursProcessResponseDto"];
export type SpecialHoursProcessStatus =
  components["schemas"]["SpecialHoursProcessStatus"];
