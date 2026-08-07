"use client";

import { useFormatter, useTranslations } from "next-intl";
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

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Chip, Stack } from "@mui/material";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { userCouponSourceValues } from "@/types/api";
import type {
  CouponRecipient,
  CouponRecipientFilterField,
  CouponRecipientSortField,
} from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  getQuickFilterEnums,
} from "@/utils/dataGrid";
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

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tCoupons = useTranslations("coupons");

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const enumOptions = useMemo(
    () => ({
      source: userCouponSourceValues.map((value) => ({
        label: tCoupons(`source.${value}`),
        value,
      })),
      usedAt: [
        { label: tCoupons("recipients.used"), value: "used" },
        { label: tCoupons("recipients.unused"), value: "unused" },
      ],
    }),
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
      // quickFilterEnums 是多值參數,逐項複製才不會被壓成單一值
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
      params.delete("quickFilterEnums");
      params.set("page", "1");
      if (filterField) params.set("filterField", filterField);
      if (filterOperator) params.set("filterOperator", filterOperator);
      if (filterValue) params.set("filterValue", filterValue);
      if (newQuickFilterValue) {
        params.set("quickFilterValue", newQuickFilterValue);
        for (const entry of getQuickFilterEnums(
          newQuickFilterValue,
          enumOptions,
        ))
          params.append("quickFilterEnums", entry);
      }

      router.replace(`${pathname}?${params.toString()}`);
    },
    [enumOptions, pathname, router, searchParams],
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
