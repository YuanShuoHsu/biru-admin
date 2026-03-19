"use client";

import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

import type { Order, OrderStatus, OrdersQuery } from "@/types/orders";

interface OrderToolbarProps {
  query: OrdersQuery;
  onQueryChange: (updates: Partial<OrdersQuery>) => void;
  rows: Order[];
}

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "全部" },
  { value: "pending", label: "待處理" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

const exportToCsv = (rows: Order[]) => {
  const headers = ["訂單編號", "狀態", "金額", "店家", "桌號", "建立時間"];
  const csvRows = rows.map((r) =>
    [
      r.id,
      r.status,
      r.totalPrice,
      r.storeId,
      r.tableId ?? "",
      r.createdAt,
    ].join(","),
  );
  const csv = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const OrderToolbar = ({ query, onQueryChange, rows }: OrderToolbarProps) => {
  const [searchValue, setSearchValue] = useState(query.search);

  // Derived state: sync input when URL changes (e.g. browser back/forward)
  const [prevQuerySearch, setPrevQuerySearch] = useState(query.search);
  if (prevQuerySearch !== query.search) {
    setPrevQuerySearch(query.search);
    setSearchValue(query.search);
  }

  // Debounce: push to URL only when user typed something new
  useEffect(() => {
    if (searchValue === query.search) return;
    const timer = setTimeout(() => {
      onQueryChange({ search: searchValue, page: 1 });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, query.search, onQueryChange]);

  return (
    <Box
      sx={{
        p: 1,
        display: "flex",
        gap: 1,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <TextField
        size="small"
        placeholder="請輸入訂單編號或店家"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        sx={{ width: 240 }}
      />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>狀態</InputLabel>
        <Select
          label="狀態"
          value={query.status}
          onChange={(e) =>
            onQueryChange({
              status: e.target.value as OrderStatus | "",
              page: 1,
            })
          }
        >
          {STATUS_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        size="small"
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => exportToCsv(rows)}
      >
        匯出 CSV
      </Button>
    </Box>
  );
};

export default OrderToolbar;
