"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import { useAuditLogObjectLabels } from "@/hooks/useAuditLogObjectLabels";
import { useAuditLogValueLabels } from "@/hooks/useAuditLogValueLabels";
import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { Chip, Stack, Typography } from "@mui/material";
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
import type { LocalizedText } from "@/types/locale";

import { getAuditLogsPath } from "@/utils/audit";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAuditLogEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ACTION_COLORS: Record<AuditAction, "error" | "info" | "success"> = {
  create: "success",
  delete: "error",
  update: "info",
};

const FIELD_LABEL_KEYS = {
  addOnMenuItemId: "field.addOnMenuItem",
  addOnMenuSectionId: "field.addOnMenuSection",
  availability: "field.availability",
  availableModes: "field.availableModes",
  confirmationNumber: "field.confirmationNumber",
  customer: "field.customer",
  deliveryLeadTime: "field.deliveryLeadTime",
  description: "field.description",
  discount: "field.discount",
  displayName: "field.displayName",
  image: "field.image",
  inventoryLevel: "field.inventoryLevel",
  maxSelectionCount: "field.maxSelectionCount",
  menuSectionId: "field.menuSection",
  minSelectionCount: "field.minSelectionCount",
  modifierGroupId: "field.modifierGroup",
  name: "field.name",
  nutrition: "field.nutrition",
  orderStatus: "field.orderStatus",
  partySize: "field.partySize",
  paymentDate: "field.paymentDate",
  paymentMethod: "field.paymentMethod",
  price: "field.price",
  priceAdjustment: "field.priceAdjustment",
  priceCurrency: "field.priceCurrency",
  priceSpecification: "field.priceSpecification",
  sortOrder: "field.sortOrder",
  subtotal: "field.subtotal",
  suitableForDiet: "field.suitableForDiet",
  tableNumber: "field.tableNumber",
  total: "field.total",
  usedAt: "field.usedAt",
} as const;

const LOCALES = new Set<string>(routing.locales);

const LOCALIZED_FIELDS = new Set(["description", "displayName", "name"]);

const NUMERIC_FIELDS = new Set([
  "discount",
  "price",
  "priceAdjustment",
  "subtotal",
  "total",
]);

const isTranslatableField = (
  field: string,
): field is keyof typeof FIELD_LABEL_KEYS => field in FIELD_LABEL_KEYS;

const isLocalizedField = (
  value: object,
  field: string,
): value is LocalizedText =>
  LOCALIZED_FIELDS.has(field) &&
  Object.entries(value).every(
    ([key, text]) => LOCALES.has(key) && typeof text === "string",
  );

interface AuditLogsProps {
  filterField?: AuditLogFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  logs: AuditLogResponse[];
  organizationSlug: string;
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
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  logs: initialLogs,
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

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const enumOptions = useMemo(
    () => getAuditLogEnumOptions(tAudit, !resource),
    [resource, tAudit],
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
    const toText = (field: string, value: unknown): string => {
      if (value === null || value === undefined || value === "")
        return tAudit("value.empty");

      if (typeof value === "boolean")
        return tAudit(value ? "value.true" : "value.false");

      if (typeof value === "string")
        return NUMERIC_FIELDS.has(field)
          ? Number(value).toLocaleString(locale)
          : (valueLabels[field]?.[value] ?? value);

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
            ([key, item]) => `${labels?.[key] ?? key}: ${toText(key, item)}`,
          );

        return entries.length
          ? format.list(entries, { type: "unit" })
          : tAudit("value.empty");
      }

      return String(value);
    };

    return toText;
  }, [format, locale, objectLabels, tAudit, valueLabels]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tAudit("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "actorName",
        filterOperators: stringFilterOperators,
        headerName: tAudit("actor"),
      },
      {
        field: "actorEmail",
        filterOperators: stringFilterOperators,
        headerName: tAudit("actorEmail"),
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
          ]),
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
      {
        field: "changes",
        filterable: false,
        headerName: tAudit("changes"),
        renderCell: ({ row }: GridRenderCellParams<AuditLogResponse>) => (
          <Stack alignItems="center" direction="row" gap={2} height="100%">
            {Object.entries(row.changes).map(([field, change]) => (
              <Stack alignItems="center" direction="row" gap={0.5} key={field}>
                <Typography color="text.secondary" variant="caption">
                  {isTranslatableField(field)
                    ? tAudit(FIELD_LABEL_KEYS[field])
                    : field}
                </Typography>
                <Typography
                  sx={{ textDecoration: "line-through" }}
                  color="text.disabled"
                  variant="caption"
                >
                  {getValueText(field, change.before)}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  →
                </Typography>
                <Typography variant="caption">
                  {getValueText(field, change.after)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ),
        sortable: false,
      },
    ],
    [
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      getValueText,
      resource,
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
