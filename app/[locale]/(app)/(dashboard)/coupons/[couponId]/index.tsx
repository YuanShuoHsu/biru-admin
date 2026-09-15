"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Chip, Stack } from "@mui/material";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import type {
  CouponRecipient,
  CouponRecipientFilterField,
  CouponRecipientSortField,
} from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getCouponRecipientEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface CouponRecipientsProps {
  couponId: string;
  filterField?: CouponRecipientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  recipients: CouponRecipient[];
  rowCount: number;
  sortBy?: CouponRecipientSortField;
  sortDirection?: SortDirection;
}

const CouponRecipients = ({
  couponId,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  recipients: initialRecipients,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: CouponRecipientsProps) => {
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

  const tCoupons = useTranslations("coupons");

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getCouponRecipientEnumOptions(tCoupons),
    [tCoupons],
  );

  const {
    data: { data: recipients, total: rowCount } = {
      data: initialRecipients,
      total: initialRowCount,
    },
    isValidating: loading,
  } = useSWR(
    [
      `/api/coupons/${couponId}/recipients`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    ([path]) =>
      fetcher<{ data: CouponRecipient[]; total: number }>(
        `${path}?${getDataGridSearchParams(
          paginationModel,
          filterModel,
          sortModel,
          enumOptions,
        )}`,
      ),
    {
      fallbackData: { data: initialRecipients, total: initialRowCount },
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

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "userEmail",
        filterOperators: stringFilterOperators,
        headerName: tCoupons("recipients.recipient"),
      },
      {
        field: "source",
        filterOperators: enumFilterOperators,
        headerName: tCoupons("recipients.source"),
        renderCell: ({
          row: { source },
        }: GridRenderCellParams<CouponRecipient>) => (
          <Stack alignItems="center" direction="row" height="100%">
            <Chip
              label={tCoupons(`source.${source}`)}
              size="small"
              variant="outlined"
            />
          </Stack>
        ),
        type: "singleSelect",
        valueOptions: enumOptions.source,
      },
      {
        field: "grantedByEmail",
        filterOperators: stringFilterOperators,
        headerName: tCoupons("recipients.grantedBy"),
        renderCell: renderEmptyableCell,
        valueGetter: (
          _value: unknown,
          { grantedByEmail, source }: CouponRecipient,
        ) =>
          source === "granted"
            ? grantedByEmail || tCoupons("recipients.unknownGranter")
            : "",
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tCoupons("recipients.receivedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "usedAt",
        filterOperators: enumFilterOperators,
        headerName: tCoupons("recipients.status"),
        renderCell: ({
          row: { usedAt },
        }: GridRenderCellParams<CouponRecipient>) => (
          <Stack alignItems="center" direction="row" height="100%">
            <Chip
              color={usedAt ? "default" : "success"}
              label={tCoupons(usedAt ? "recipients.used" : "recipients.unused")}
              size="small"
              variant="outlined"
            />
          </Stack>
        ),
        type: "singleSelect",
        valueOptions: enumOptions.usedAt,
      },
    ],
    [
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      stringFilterOperators,
      tCoupons,
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
      rows={recipients}
      sortingMode="server"
      sortModel={sortModel}
    />
  );
};

export default CouponRecipients;
