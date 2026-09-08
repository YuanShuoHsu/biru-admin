"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { PLATFORM_ORGANIZATION_ID } from "@/constants/organizations";
import {
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

import { Link, usePathname, useRouter } from "@/i18n/navigation";
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
import type { OrganizationResponse } from "@/types/organizations";

import { getAuditLogHref, getAuditLogsPath } from "@/utils/audit";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAuditLogEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";
import { formatStock } from "@/utils/ingredients";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ChangeImage = styled("img")(({ theme }) => ({
  height: theme.spacing(4),
  width: "auto",
  borderRadius: theme.shape.borderRadius,
}));

const ACTION_COLORS: Record<AuditAction, "error" | "info" | "success"> = {
  create: "success",
  delete: "error",
  update: "info",
};

const FIELD_LABEL_KEYS = {
  name: "field.name",
  displayName: "field.displayName",
  description: "field.description",
  image: "field.image",
  brand: "field.brand",
  nutrition: "field.nutrition",
  suitableForDiet: "field.suitableForDiet",
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
  lowStockThreshold: "field.lowStockThreshold",
  supplierId: "field.supplier",
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
  amountPerPoint: "field.amountPerPoint",
  pointsValidityYears: "field.pointsValidityYears",
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
} as const;

const FIELD_RANK = new Map(
  Object.keys(FIELD_LABEL_KEYS).map((field, index) => [field, index]),
);

const LOCALES = new Set<string>(routing.locales);

const LOCALIZED_FIELDS = new Set(["description", "displayName", "name"]);

const isImageValue = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("data:image/");

const isUrlValue = (value: unknown): value is string =>
  typeof value === "string" && /^https?:\/\//.test(value);

const STOCK_FIELDS = new Set(["inventoryLevel", "lowStockThreshold"]);

const NUMERIC_FIELDS = new Set([
  "discount",
  "eligibleQuantity",
  "inventoryLevel",
  "lowStockThreshold",
  "price",
  "priceAdjustment",
  "requiredQuantity",
  "subtotal",
  "total",
]);

const isTranslatableField = (
  field: string,
): field is keyof typeof FIELD_LABEL_KEYS => field in FIELD_LABEL_KEYS;

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
  logs: AuditLogResponse[];
  organizations: OrganizationResponse[];
  organizationSlug?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  resource?: AuditResource;
  resourceId?: string;
  rowCount: number;
  sortBy?: AuditLogSortField;
  sortDirection?: SortDirection;
}

const AuditLogs = ({
  ancestorId,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  ingredient,
  logs: initialLogs,
  organizations,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  resource,
  resourceId,
  rowCount: initialRowCount,
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

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tAudit = useTranslations("audit");
  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const enumOptions = useMemo(
    () => getAuditLogEnumOptions(tAudit, !resource, organizations),
    [organizations, resource, tAudit],
  );
  const valueLabels = useAuditLogValueLabels();
  const objectLabels = useAuditLogObjectLabels();

  const {
    data: { data: logs, total: rowCount } = {
      data: initialLogs,
      total: initialRowCount,
    },
    isValidating: loading,
  } = useSWR(
    [
      getAuditLogsPath(organizationSlug),
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

      const params = new URLSearchParams(searchParams);
      params.set("page", String(newModel.page + 1));
      params.set("pageSize", String(newModel.pageSize));

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const sortItem = newModel[0];
      const params = new URLSearchParams(searchParams);
      params.delete("sortBy");
      params.delete("sortDirection");
      params.set("page", "1");
      if (sortItem?.field) params.set("sortBy", sortItem.field);
      if (sortItem?.sort) params.set("sortDirection", sortItem.sort);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const filterItem = newModel.items[0];
      const newQuickFilterValue = (newModel.quickFilterValues || [])
        .join(" ")
        .trim();
      const params = new URLSearchParams(searchParams);
      const { filterField, filterOperator, filterValue } =
        getFilterItemParams(filterItem);
      params.delete("filterField");
      params.delete("filterOperator");
      params.delete("filterValue");
      params.delete("quickFilterValue");
      params.set("page", "1");
      if (filterField) params.set("filterField", filterField);
      if (filterOperator) params.set("filterOperator", filterOperator);
      if (filterValue) params.set("filterValue", filterValue);
      if (newQuickFilterValue)
        params.set("quickFilterValue", newQuickFilterValue);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const getValueText = useMemo(() => {
    const toText = (
      field: string,
      value: unknown,
      changeLabels: AuditLogResponse["changeLabels"],
    ): string => {
      if (value === null || value === undefined || value === "")
        return tAudit("value.empty");

      if (typeof value === "boolean")
        return tAudit(value ? "value.true" : "value.false");

      if (typeof value === "string") {
        const snapshot = changeLabels?.[field]?.[value];
        if (snapshot) return getTargetLabel(snapshot, locale);

        if (ingredient && STOCK_FIELDS.has(field))
          return formatStock(Number(value), ingredient, {
            format,
            tCommon,
            tInventory,
          });

        return NUMERIC_FIELDS.has(field)
          ? format.number(Number(value))
          : (valueLabels[field]?.[value] ?? value);
      }

      if (Array.isArray(value))
        return value.length
          ? format.list(
              value.map((item) =>
                typeof item === "string"
                  ? (valueLabels[field]?.[item] ?? item)
                  : String(item),
              ),
            )
          : tAudit("value.empty");

      if (typeof value === "object") {
        if (isLocalizedField(value, field)) return localize(value, locale);

        const labels = objectLabels[field];
        const entries = Object.entries(value)
          .filter(
            ([, item]) => item !== null && item !== undefined && item !== "",
          )
          .map(
            ([key, item]) =>
              `${labels?.[key] ?? key}: ${toText(key, item, changeLabels)}`,
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
          <Stack
            alignItems="center"
            direction="row"
            divider={
              <Divider flexItem orientation="vertical" sx={{ my: 1.5 }} />
            }
            gap={1.5}
            height="100%"
          >
            {Object.entries(row.changes)
              .sort(
                ([a], [b]) =>
                  (FIELD_RANK.get(a) ?? FIELD_RANK.size) -
                  (FIELD_RANK.get(b) ?? FIELD_RANK.size),
              )
              .map(([field, change]) => {
                const label = isTranslatableField(field)
                  ? tAudit(FIELD_LABEL_KEYS[field])
                  : field;

                const renderValue = (
                  value: unknown,
                  state?: "previous" | "removed",
                ) =>
                  isImageValue(value) ? (
                    <ChangeImage
                      alt={tAudit("value.image")}
                      src={value}
                      sx={state ? { opacity: 0.5 } : undefined}
                    />
                  ) : isUrlValue(value) ? (
                    <MuiLink
                      color={state ? "text.disabled" : undefined}
                      href={value}
                      rel="noopener"
                      sx={{
                        display: "block",
                        maxWidth: "20ch",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        ...(state === "removed" && {
                          textDecoration: "line-through",
                        }),
                      }}
                      target="_blank"
                      variant="caption"
                    >
                      {value}
                    </MuiLink>
                  ) : (
                    <Typography
                      sx={
                        state === "removed"
                          ? { textDecoration: "line-through" }
                          : undefined
                      }
                      color={state ? "text.disabled" : undefined}
                      variant="caption"
                    >
                      {getValueText(field, value, row.changeLabels)}
                    </Typography>
                  );

                return (
                  <Stack
                    alignItems="center"
                    direction="row"
                    gap={0.5}
                    key={field}
                  >
                    <Typography color="text.secondary" variant="caption">
                      {label}
                    </Typography>
                    {row.action === "create" ? (
                      renderValue(change.after)
                    ) : row.action === "delete" ? (
                      renderValue(change.before, "removed")
                    ) : (
                      <>
                        {renderValue(change.before, "previous")}
                        <Typography color="text.secondary" variant="caption">
                          →
                        </Typography>
                        {renderValue(change.after)}
                      </>
                    )}
                  </Stack>
                );
              })}
          </Stack>
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
      loading={loading}
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
    />
  );
};

export default AuditLogs;
