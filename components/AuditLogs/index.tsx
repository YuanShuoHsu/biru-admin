"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { PLATFORM_ORGANIZATION_ID } from "@/constants/organizations";
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGINATION_QUERY,
  getPageSizeOptions,
} from "@/constants/pagination";

import { useAuditLogObjectLabels } from "@/hooks/useAuditLogObjectLabels";
import { useAuditLogValueLabels } from "@/hooks/useAuditLogValueLabels";
import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

import {
  Chip,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import type {
  AuditAction,
  AuditLogFilterField,
  AuditLogResponse,
  AuditLogSortField,
  AuditResource,
} from "@/types/audit";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Ingredient } from "@/types/inventory";
import type { LocalizedText } from "@/types/locale";
import type { Organization, OrganizationResponse } from "@/types/organizations";

import { formatLeaveDuration, weekdayDate } from "@/utils/attendance";
import { getAuditLogHref, getAuditLogsPath } from "@/utils/audit";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAuditLogEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import { formatStock } from "@/utils/ingredients";
import { localize } from "@/utils/locale";

const ChangesStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1.5),
  height: "100%",
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  marginTop: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
}));

const ChangeImage = styled("img", {
  shouldForwardProp: (prop) => prop !== "dimmed",
})<{ dimmed: boolean }>(({ dimmed, theme }) => ({
  height: theme.spacing(4),
  width: "auto",
  borderRadius: theme.shape.borderRadius,

  ...(dimmed && {
    opacity: 0.5,
  }),
}));

const StyledLink = styled(MuiLink, {
  shouldForwardProp: (prop) => prop !== "removed",
})<{ removed: boolean }>(({ removed }) => ({
  display: "block",
  maxWidth: "20ch",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",

  ...(removed && {
    textDecoration: "line-through",
  }),
}));

const StyledTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "removed",
})<{ removed: boolean }>(({ removed }) => ({
  ...(removed && {
    textDecoration: "line-through",
  }),
}));

const ChangeRowStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const ACTION_COLORS: Record<AuditAction, "error" | "info" | "success"> = {
  cancel: "error",
  consume: "info",
  create: "success",
  delete: "error",
  publish: "info",
  refund: "success",
  request: "info",
  restore: "success",
  review: "info",
  update: "info",
  withdraw: "info",
};

const FIELD_LABEL_KEYS = {
  name: "field.name",
  displayName: "field.displayName",
  description: "field.description",
  image: "field.image",
  brand: "field.brand",
  nutrition: "field.nutrition",
  suitableForDiet: "field.suitableForDiet",
  servingTemperatures: "field.servingTemperatures",
  sweetness: "field.sweetness",
  fixedSweetnessLevel: "field.fixedSweetnessLevel",
  recommendedServingTemperatureLevel:
    "field.recommendedServingTemperatureLevel",
  recommendedSweetnessLevel: "field.recommendedSweetnessLevel",
  availability: "field.availability",
  availableModes: "field.availableModes",
  isActive: "field.isActive",
  discountCurrency: "field.discountCurrency",
  price: "field.price",
  priceSpecification: "field.priceSpecification",
  priceAdjustment: "field.priceAdjustment",
  eligibleQuantity: "field.eligibleQuantity",
  eligibleQuantityUnitCode: "field.eligibleQuantityUnitCode",
  unitCode: "field.unitCode",
  inventoryLevel: "field.inventoryLevel",
  inventoryLevelUnitText: "field.inventoryLevelUnitText",
  lowStockThreshold: "field.lowStockThreshold",
  recipeYield: "field.recipeYield",
  recipeInstructions: "field.recipeInstructions",
  requiredQuantity: "field.requiredQuantity",
  supplierId: "field.supplier",
  ingredientId: "field.ingredient",
  recipeId: "field.recipe",
  minSelectionCount: "field.minSelectionCount",
  maxSelectionCount: "field.maxSelectionCount",
  modifierGroupId: "field.modifierGroup",
  menuId: "field.menu",
  menuSectionId: "field.menuSection",
  parentSectionId: "field.parentSection",
  menuItemId: "field.menuItem",
  addOnMenuSectionId: "field.addOnMenuSection",
  addOnMenuItemId: "field.addOnMenuItem",
  couponId: "field.coupon",
  discount: "field.discount",
  source: "field.source",
  grantedBy: "field.grantedBy",
  userId: "field.user",
  usedAt: "field.usedAt",
  orderId: "field.order",
  orderStatus: "field.orderStatus",
  customer: "field.customer",
  partySize: "field.partySize",
  tableNumber: "field.tableNumber",
  confirmationNumber: "field.confirmationNumber",
  paymentMethod: "field.paymentMethod",
  paymentDate: "field.paymentDate",
  subtotal: "field.subtotal",
  total: "field.total",
  amount: "field.amount",
  scope: "field.scope",
  channel: "field.channel",
  items: "field.items",
  reasonCode: "field.reasonCode",
  reason: "field.reason",
  invoiceAction: "field.invoiceAction",
  invoiceError: "field.invoiceError",
  allowanceNo: "field.allowanceNo",
  amountPerPoint: "field.amountPerPoint",
  pointsValidityYears: "field.pointsValidityYears",
  accountingValuePerPoint: "field.accountingValuePerPoint",
  deliveryLeadTimeMinutes: "field.deliveryLeadTimeMinutes",
  url: "field.url",
  telephone: "field.telephone",
  note: "field.note",
  sortOrder: "field.sortOrder",
  slug: "field.slug",
  logo: "field.logo",
  currency: "field.currency",
  addressCountry: "field.addressCountry",
  addressLocality: "field.addressLocality",
  addressRegion: "field.addressRegion",
  extendedAddress: "field.extendedAddress",
  postalCode: "field.postalCode",
  streetAddress: "field.streetAddress",
  hasMap: "field.hasMap",
  openingHours: "field.openingHours",
  pointsEnabledAt: "field.pointsEnabledAt",
  pickupLeadMinutes: "field.pickupLeadMinutes",
  pickupMaxAdvanceDays: "field.pickupMaxAdvanceDays",
  pickupCutoffMinutes: "field.pickupCutoffMinutes",
  dineInTableCount: "field.dineInTableCount",
  prefix: "field.prefix",
  number: "field.number",
  status: "field.status",
  phoneNumber: "field.phoneNumber",
  email: "field.email",
  locale: "field.locale",
  serviceDate: "field.serviceDate",
  calledAt: "field.calledAt",
  confirmedAt: "field.confirmedAt",
  endedAt: "field.endedAt",
  enabled: "field.enabled",
  paused: "field.paused",
  groups: "field.groups",
  holdMinutes: "field.holdMinutes",
  graceMinutes: "field.graceMinutes",
  cutoffMinutes: "field.cutoffMinutes",
  memberRole: "field.memberRole",
  inviterId: "field.inviter",
  invitationStatus: "field.invitationStatus",
  expiresAt: "field.expiresAt",
  role: "field.role",
  emailVerified: "field.emailVerified",
  banned: "field.banned",
  banReason: "field.banReason",
  banExpires: "field.banExpires",
  impersonatedBy: "field.impersonatedBy",
  passwordReset: "field.passwordReset",
  revokedSessions: "field.revokedSessions",
  member: "field.member",
  closedAt: "field.closedAt",
  startTime: "field.startTime",
  endTime: "field.endTime",
  breaks: "field.breaks",
  paidBreak: "field.paidBreak",
  minutes: "field.minutes",
  weeklyMinutes: "field.weeklyMinutes",
  weeklyMinutesHistory: "field.weeklyMinutesHistory",
  periodStart: "field.periodStart",
  originalEndsAt: "field.originalEndsAt",
  irreversible: "field.irreversible",
  username: "field.username",
  purpose: "field.purpose",
  carrierNum: "field.carrierNum",
  carrierType: "field.carrierType",
  customerAddr: "field.customerAddr",
  customerIdentifier: "field.customerIdentifier",
  customerName: "field.customerName",
  donateCode: "field.donateCode",
  invoiceDate: "field.invoiceDate",
  invoiceNumber: "field.invoiceNumber",
  paymentStatus: "field.paymentStatus",
  printResetCount: "field.printResetCount",
  printResetReason: "field.printResetReason",
  printedAt: "field.printedAt",
  randomNumber: "field.randomNumber",
  relateNumber: "field.relateNumber",
  type: "field.type",
  voidedAt: "field.voidedAt",
} as const;

const ATTENDANCE_FIELD_LABEL_KEYS = {
  employeeId: "employee",
  "parentalChild.reference": "childReference",
  reference: "caseReference.label",
  leaveTypeId: "leaveType.label",
  childId: "parentalChild",
  kind: "kind.label",
  statutoryKind: "statutoryKind.label",
  teamId: "team",
  dayKind: "dayKind.label",
  startsAt: "startsAt",
  endsAt: "endsAt",
  eventDate: "eventDate",
  holidayDate: "holidaySubstitutes.holidayDate",
  returnsAt: "returnsAt",
  grantedMinutes: "grantedMinutes",
  paidPercent: "paidPercent",
  requiresBalance: "requiresBalance",
  medicalCertified: "medicalCertified",
  category: "earningCategory.label",
  acknowledgedViolations: "payroll.violations",
  year: "year",
  month: "month",
  effectiveFrom: "effectiveFrom",
  hiredAt: "hiredAt",
  terminatedAt: "terminatedAt",
  terminationNoticedAt: "terminationNoticedAt",
  terminationReason: "terminationReason.label",
  birthDate: "birthDate",
  legalStatus: "legalStatus.label",
  taiwanStaySince: "taiwanStaySince",
  regularLeaveWeekday: "restWeekdays.regularLeaveWeekday",
  restDayWeekday: "restWeekdays.restDayWeekday",
  workPermits: "workPermits.label",
  studentVacations: "studentVacations.label",
  pregnancyPeriods: "pregnancyPeriods.label",
  nursingPeriods: "nursingPeriods.label",
  indigenousHolidays: "indigenousHolidays.label",
  allowedIps: "allowedIps.label",
  latitude: "latitude.label",
  longitude: "longitude.label",
  radiusMeters: "radiusMeters.label",
  graceMinutes: "graceMinutes.label",
  payday: "payday.label",
  paydayNextMonth: "paydayNextMonth",
  overtimeAgreedFrom: "overtimeAgreedFrom.label",
  overtimeExtensionPeriods: "overtimeExtensionPeriods.label",
  laborInsuranceUnitCode: "laborInsuranceUnitCode.label",
  voluntaryLaborInsuranceFrom: "voluntaryLaborInsuranceFrom.label",
  occupationalIndustryCode: "occupationalIndustryCode.label",
  occupationalExperienceRateMicros: "occupationalExperienceRateMicros.label",
  taxId: "withholding.taxId",
  businessNumber: "withholding.unit.fields.businessNumber",
  taxOfficeCode: "withholding.unit.fields.taxOfficeCode",
  taxRegistrationNumber: "withholding.unit.fields.taxRegistrationNumber",
  "withholdingUnit.name": "withholding.unit.fields.name",
  "withholdingUnit.address": "withholding.unit.fields.address",
  agentName: "withholding.unit.fields.agentName",
  representativeName: "withholding.unit.fields.representativeName",
  contactName: "withholding.unit.fields.contactName",
  contactPhone: "withholding.unit.fields.contactPhone",
  contactEmail: "withholding.unit.fields.contactEmail",
} as const;

const FIELD_RANK = new Map(
  [
    ...Object.keys(ATTENDANCE_FIELD_LABEL_KEYS),
    ...Object.keys(FIELD_LABEL_KEYS),
  ].map((field, index) => [field, index]),
);

const LOCALES = new Set<string>(routing.locales);

const LOCALIZED_FIELDS = new Set([
  "description",
  "displayName",
  "name",
  "recipeInstructions",
]);

const isImageValue = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("data:image/");

const isRedactedValue = (value: object) =>
  "redacted" in value && value.redacted === true;

const isUrlValue = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\//.test(value);

const STOCK_FIELDS = new Set(["inventoryLevel", "lowStockThreshold"]);

const TIMESTAMP_FIELDS = new Set([
  "banExpires",
  "calledAt",
  "closedAt",
  "confirmedAt",
  "endedAt",
  "endsAt",
  "expiresAt",
  "invoiceDate",
  "paymentDate",
  "pointsEnabledAt",
  "printedAt",
  "returnsAt",
  "startsAt",
  "usedAt",
  "voidedAt",
]);

const DATE_FIELDS = new Set([
  "birthDate",
  "eventDate",
  "from",
  "hiredAt",
  "holidayDate",
  "indigenousHolidays",
  "originalEndsAt",
  "periodStart",
  "taiwanStaySince",
  "terminatedAt",
  "terminationNoticedAt",
  "to",
]);

const MINUTE_FIELDS = new Set(["grantedMinutes", "minutes", "weeklyMinutes"]);

const WEEKDAY_FIELDS = new Set(["regularLeaveWeekday", "restDayWeekday"]);

const NUMERIC_FIELDS = new Set([
  "amount",
  "discount",
  "eligibleQuantity",
  "inventoryLevel",
  "lowStockThreshold",
  "price",
  "priceAdjustment",
  "requiredQuantity",
  "subtotal",
  "total",
  "unitPrice",
]);

const isTranslatableField = (
  field: string,
): field is keyof typeof FIELD_LABEL_KEYS => field in FIELD_LABEL_KEYS;

const isAttendanceField = (
  field: string,
): field is keyof typeof ATTENDANCE_FIELD_LABEL_KEYS =>
  field in ATTENDANCE_FIELD_LABEL_KEYS;

const getTargetLabel = (
  label: AuditLogResponse["resourceLabel"],
  locale: Locale,
): string =>
  typeof label === "string" ? label : localize(label ?? undefined, locale);

const isLocalizedField = (
  value: object,
  field: string,
): value is LocalizedText =>
  LOCALIZED_FIELDS.has(field) &&
  Object.entries(value).every(
    ([key, text]) => LOCALES.has(key) && typeof text === "string",
  );

interface AuditLogsProps {
  ancestorId?: string;
  filterField?: AuditLogFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  ingredient?: Ingredient;
  loading?: boolean;
  logs?: AuditLogResponse[];
  organization?: Organization;
  organizations?: OrganizationResponse[];
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  resource?: AuditResource;
  resourceId?: string;
  rowCount?: number;
  sortBy?: AuditLogSortField;
  sortDirection?: SortDirection;
}

const AuditLogs = ({
  ancestorId,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  ingredient,
  loading = false,
  logs: initialLogs = [],
  organization,
  organizations = [],
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  resource,
  resourceId,
  rowCount: initialRowCount = 0,
  sortBy,
  sortDirection,
}: AuditLogsProps) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items:
      initialFilterField &&
      initialFilterOperator &&
      (initialFilterValue ||
        NO_VALUE_FILTER_OPERATORS.includes(initialFilterOperator))
        ? [
            {
              field: initialFilterField,
              operator: initialFilterOperator,
              value:
                initialFilterOperator === "isAnyOf"
                  ? initialFilterValue?.split(",")
                  : initialFilterValue,
            },
          ]
        : [],
    quickFilterValues: initialQuickFilterValue ? [initialQuickFilterValue] : [],
  });

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const locale = useLocale();

  const searchParams = useSearchParams();

  const tAttendance = useTranslations("attendance");
  const tAudit = useTranslations("audit");
  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const enumOptions = useMemo(
    () => getAuditLogEnumOptions(tAudit, tCommon, !resource, organizations),
    [organizations, resource, tAudit, tCommon],
  );
  const valueLabels = useAuditLogValueLabels();
  const objectLabels = useAuditLogObjectLabels();

  const updateQuery = useUpdateQuery();

  const {
    data: { data: logs, total: rowCount } = {
      data: initialLogs,
      total: initialRowCount,
    },
    isValidating,
  } = useSWR(
    !loading && [
      getAuditLogsPath(organization?.slug),
      resource,
      resourceId,
      ancestorId,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    ([path]) => {
      const params = getDataGridSearchParams(
        paginationModel,
        filterModel,
        sortModel,
        enumOptions,
      );
      if (resource) params.set("resource", resource);
      if (resourceId) params.set("resourceId", resourceId);
      if (ancestorId) params.set("ancestorId", ancestorId);

      return fetcher<{ data: AuditLogResponse[]; total: number }>(
        `${path}?${params.toString()}`,
      );
    },
    {
      fallbackData: { data: initialLogs, total: initialRowCount },
      keepPreviousData: true,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);

      updateQuery({
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
    },
    [updateQuery],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      updateQuery({
        page: "1",
        sortBy: newModel[0]?.field ?? "",
        sortDirection: newModel[0]?.sort ?? "",
      });
    },
    [updateQuery],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      const {
        filterField = "",
        filterOperator = "",
        filterValue = "",
      } = getFilterItemParams(newModel.items[0]);

      updateQuery({
        filterField,
        filterOperator,
        filterValue,
        page: "1",
        quickFilterValue: (newModel.quickFilterValues ?? []).join(" ").trim(),
      });
    },
    [updateQuery],
  );

  const getValueText = useMemo(() => {
    const toText = (
      field: string,
      value: unknown,
      row: AuditLogResponse,
    ): string => {
      if (value === null || value === undefined || value === "")
        return tAudit("value.empty");

      if (typeof value === "boolean")
        return tAudit(value ? "value.true" : "value.false");

      if (typeof value === "string") {
        const snapshot = row.changeLabels?.[field]?.[value];
        if (snapshot) return getTargetLabel(snapshot, locale);

        if (TIMESTAMP_FIELDS.has(field))
          return format.dateTime(new Date(value), "short");

        if (DATE_FIELDS.has(field))
          return format.dateTime(new Date(value), "date");

        if (ingredient && STOCK_FIELDS.has(field))
          return formatStock(Number(value), ingredient, {
            format,
            tCommon,
            tInventory,
          });

        return NUMERIC_FIELDS.has(field)
          ? format.number(Number(value))
          : (valueLabels[`${row.resource}.${field}`]?.[value] ??
              valueLabels[field]?.[value] ??
              value);
      }

      if (typeof value === "number" && MINUTE_FIELDS.has(field))
        return formatLeaveDuration(tAttendance, value, false);

      if (typeof value === "number" && WEEKDAY_FIELDS.has(field))
        return format.dateTime(weekdayDate(value), "weekdayLong");

      if (
        typeof value === "number" &&
        field === "occupationalExperienceRateMicros"
      )
        return format.number(value / 1000000, {
          maximumFractionDigits: 6,
          style: "percent",
        });

      if (Array.isArray(value))
        return value.length
          ? format.list(value.map((item) => toText(field, item, row)))
          : tAudit("value.empty");

      if (typeof value === "object") {
        if (isRedactedValue(value)) return tAudit("value.redacted");

        if (isLocalizedField(value, field)) return localize(value, locale);

        const labels = objectLabels[field];
        const entries = Object.entries(value)
          .filter(
            ([, item]) => item !== null && item !== undefined && item !== "",
          )
          .map(
            ([key, item]) =>
              `${labels?.[key] ?? key}: ${toText(key, item, row)}`,
          );

        return entries.length
          ? format.list(entries, { type: "unit" })
          : tAudit("value.empty");
      }

      return String(value);
    };

    return toText;
  }, [
    format,
    ingredient,
    locale,
    objectLabels,
    tAttendance,
    tAudit,
    tCommon,
    tInventory,
    valueLabels,
  ]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(organizations.length
        ? [
            {
              field: "organizationId",
              filterOperators: enumFilterOperators,
              headerName: tAudit("organization"),
              type: "singleSelect" as const,
              valueGetter: (value: string | null) =>
                value ?? PLATFORM_ORGANIZATION_ID,
              valueOptions: enumOptions.organizationId,
            },
          ]
        : []),
      {
        field: "actorName",
        filterOperators: stringFilterOperators,
        headerName: tAudit("actor"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "actorEmail",
        filterOperators: stringFilterOperators,
        headerName: tAudit("actorEmail"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "action",
        filterOperators: enumFilterOperators,
        headerName: tAudit("action.label"),
        type: "singleSelect",
        valueOptions: enumOptions.action,
        renderCell: ({ row }: GridRenderCellParams<AuditLogResponse>) => (
          <Chip
            color={ACTION_COLORS[row.action]}
            label={tAudit(`action.${row.action}`)}
            size="small"
          />
        ),
      },
      ...(resource
        ? []
        : [
            {
              field: "resource",
              filterOperators: enumFilterOperators,
              headerName: tAudit("resource.label"),
              type: "singleSelect" as const,
              valueOptions: enumOptions.resource,
            },
            {
              field: "resourceLabel",
              filterable: false,
              headerName: tAudit("target"),
              renderCell: ({ row }: GridRenderCellParams<AuditLogResponse>) => {
                const label = getTargetLabel(row.resourceLabel, locale);
                const href = getAuditLogHref(
                  row.resource,
                  row.resourceId,
                  row.ancestorIds ?? [],
                );

                return label && href ? (
                  <MuiLink
                    component={Link}
                    href={getHref(href, {
                      ...DEFAULT_PAGINATION_QUERY,
                      organization: searchParams.get("organization"),
                    })}
                  >
                    {label}
                  </MuiLink>
                ) : (
                  label || <EmptyCell />
                );
              },
              sortable: false,
            },
          ]),
      {
        field: "changes",
        filterable: false,
        headerName: tAudit("changes"),
        renderCell: ({ row }: GridRenderCellParams<AuditLogResponse>) => (
          <ChangesStack
            direction="row"
            divider={<StyledDivider flexItem orientation="vertical" />}
          >
            {Object.entries(row.changes)
              .sort(
                ([a], [b]) =>
                  (FIELD_RANK.get(a) ?? FIELD_RANK.size) -
                  (FIELD_RANK.get(b) ?? FIELD_RANK.size),
              )
              .map(([field, change]) => {
                const scopedField = `${row.resource}.${field}`;
                const label = isAttendanceField(scopedField)
                  ? tAttendance(ATTENDANCE_FIELD_LABEL_KEYS[scopedField])
                  : isTranslatableField(field)
                    ? tAudit(FIELD_LABEL_KEYS[field])
                    : isAttendanceField(field)
                      ? tAttendance(ATTENDANCE_FIELD_LABEL_KEYS[field])
                      : field;

                const renderValue = (
                  value: unknown,
                  state?: "previous" | "removed",
                ) =>
                  isImageValue(value) ? (
                    <ChangeImage
                      alt={tAudit("value.image")}
                      dimmed={!!state}
                      src={value}
                    />
                  ) : isUrlValue(value) ? (
                    <StyledLink
                      color={state ? "textDisabled" : undefined}
                      href={value}
                      rel="noopener"
                      removed={state === "removed"}
                      target="_blank"
                      variant="caption"
                    >
                      {value}
                    </StyledLink>
                  ) : (
                    <StyledTypography
                      color={state ? "textDisabled" : undefined}
                      removed={state === "removed"}
                      variant="caption"
                    >
                      {getValueText(field, value, row)}
                    </StyledTypography>
                  );

                return (
                  <ChangeRowStack direction="row" key={field}>
                    <Typography color="textSecondary" variant="caption">
                      {label}
                    </Typography>
                    {row.action === "delete" ? (
                      renderValue(change.before, "removed")
                    ) : row.action !== "update" || !("before" in change) ? (
                      renderValue(change.after)
                    ) : (
                      <>
                        {renderValue(change.before, "previous")}
                        <Typography color="textSecondary" variant="caption">
                          →
                        </Typography>
                        {renderValue(change.after)}
                      </>
                    )}
                  </ChangeRowStack>
                );
              })}
          </ChangesStack>
        ),
        sortable: false,
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tAudit("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      getValueText,
      locale,
      organizations,
      resource,
      searchParams,
      stringFilterOperators,
      tAttendance,
      tAudit,
    ],
  );

  return (
    <DataGrid
      {...DATA_GRID_PROPS}
      apiRef={apiRef}
      columns={columns}
      filterMode="server"
      filterModel={filterModel}
      loading={loading || isValidating}
      onFilterModelChange={handleFilterModelChange}
      onPaginationModelChange={handlePaginationModelChange}
      onSortModelChange={handleSortModelChange}
      pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
      paginationMode="server"
      paginationModel={paginationModel}
      rowCount={rowCount}
      rows={logs}
      sortingMode="server"
      sortModel={sortModel}
      slotProps={{
        ...DATA_GRID_PROPS.slotProps,
        toolbar: { exportDateField: "createdAt" },
      }}
    />
  );
};

export default AuditLogs;
