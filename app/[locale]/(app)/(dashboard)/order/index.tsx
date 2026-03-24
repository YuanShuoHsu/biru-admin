// https://mui.com/x/react-data-grid/column-dimensions/
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type {
  GridColDef,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";

import OrderToolbar from "./OrderToolbar";

import type { Order, OrdersQuery, OrdersResponse } from "@/types/orders";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    query: OrdersQuery;
    onQueryChange: (updates: Partial<OrdersQuery>) => void;
    rows: Order[];
  }
}

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface OrderProps {
  initialData: OrdersResponse;
  query: OrdersQuery;
}

const columns: GridColDef[] = [
  { field: "id", headerName: "訂單編號", width: 200 },
  { field: "status", headerName: "狀態", width: 120 },
  {
    field: "totalPrice",
    headerName: "金額",
    width: 120,
    type: "number",
    valueFormatter: (value: number) => `$${value}`,
  },
  { field: "storeId", headerName: "店家", width: 150 },
  { field: "tableId", headerName: "桌號", width: 100 },
  {
    field: "createdAt",
    headerName: "建立時間",
    width: 200,
    valueFormatter: (value: string) =>
      value ? new Date(value).toLocaleString("zh-TW") : "",
  },
];

const Order = ({ initialData, query }: OrderProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState(initialData.data);
  const [rowCount, setRowCount] = useState(initialData.total);

  useEffect(() => {
    setRows(initialData.data);
    setRowCount(initialData.total);
  }, [initialData]);

  const updateParams = useCallback(
    (updates: Partial<OrdersQuery>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handlePaginationChange = (model: GridPaginationModel) => {
    updateParams({ page: model.page + 1, limit: model.pageSize });
  };

  const handleSortChange = (model: GridSortModel) => {
    if (model.length > 0) {
      updateParams({
        sortBy: model[0].field,
        sortDir: model[0].sort ?? "asc",
        page: 1,
      });
    } else {
      updateParams({ sortBy: "createdAt", sortDir: "desc", page: 1 });
    }
  };

  const paginationModel: GridPaginationModel = {
    page: query.page - 1,
    pageSize: query.limit,
  };

  const sortModel: GridSortModel = query.sortBy
    ? [{ field: query.sortBy, sort: query.sortDir }]
    : [];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      rowCount={rowCount}
      paginationMode="server"
      sortingMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={handlePaginationChange}
      sortModel={sortModel}
      onSortModelChange={handleSortChange}
      pageSizeOptions={[5, 10, 50, 100]}
      disableColumnFilter
      slots={{ toolbar: OrderToolbar }}
      slotProps={{ toolbar: { query, onQueryChange: updateParams, rows } }}
    />
  );
};

export default Order;
