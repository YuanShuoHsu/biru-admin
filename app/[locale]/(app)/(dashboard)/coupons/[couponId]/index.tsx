"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { Chip, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import type {
  CouponRecipient,
  CouponRecipientFilterField,
  CouponRecipientListResponse,
  CouponRecipientSortField,
} from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { getCouponRecipientEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const StyledStack = styled(Stack)({
  alignItems: "center",
  height: "100%",
});

interface CouponRecipientsProps {
  couponId?: string;
  filterField?: CouponRecipientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: CouponRecipient[];
  sortBy?: CouponRecipientSortField;
  sortDirection?: SortDirection;
}

const CouponRecipients = ({
  couponId,
  filterField,
  filterOperator,
  filterValue,
  loading = false,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: CouponRecipientsProps) => {
  const {
    filterModel,
    handleFilterModelChange,
    handlePaginationModelChange,
    handleSortModelChange,
    paginationModel,
    sortModel,
  } = useDataGridQueryState({
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  });

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const tCommon = useTranslations("common");
  const tCoupons = useTranslations("coupons");

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const enumOptions = useMemo(
    () => getCouponRecipientEnumOptions(tCoupons),
    [tCoupons],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
  } = useSWR(
    !loading && [
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
      fetcher<CouponRecipientListResponse>(
        `${path}?${getDataGridSearchParams(
          paginationModel,
          filterModel,
          sortModel,
          enumOptions,
        )}`,
      ),
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      keepPreviousData: true,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
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
          <StyledStack direction="row">
            <Chip
              label={tCoupons(`source.${source}`)}
              size="small"
              variant="outlined"
            />
          </StyledStack>
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
          { grantedByDeleted, grantedByEmail, source }: CouponRecipient,
        ) =>
          source !== "granted"
            ? ""
            : grantedByDeleted
              ? tCommon("deletedAccount")
              : grantedByEmail || tCoupons("recipients.unknownGranter"),
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
          <StyledStack direction="row">
            <Chip
              color={usedAt ? "default" : "success"}
              label={tCoupons(usedAt ? "recipients.used" : "recipients.unused")}
              size="small"
              variant="outlined"
            />
          </StyledStack>
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
      tCommon,
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
      loading={loading || isValidating}
      onFilterModelChange={handleFilterModelChange}
      onPaginationModelChange={handlePaginationModelChange}
      onSortModelChange={handleSortModelChange}
      pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
      paginationMode="server"
      paginationModel={paginationModel}
      rowCount={rowCount}
      rows={rows}
      sortingMode="server"
      sortModel={sortModel}
    />
  );
};

export default CouponRecipients;
