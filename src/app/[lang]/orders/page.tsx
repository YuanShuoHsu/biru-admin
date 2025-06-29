"use client";

import { Box, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const rows = [
  {
    id: 1,
    customer: "李小明",
    total: 320,
    date: "2025-06-28 15:23",
    status: "已完成",
  },
  {
    id: 2,
    customer: "Anna Smith",
    total: 180,
    date: "2025-06-28 15:45",
    status: "處理中",
  },
  {
    id: 3,
    customer: "山田太郎",
    total: 450,
    date: "2025-06-28 16:10",
    status: "已取消",
  },
];

const Orders = () => {
  // const dict = useI18n();

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    // { field: "customer", headerName: dict.orders.customer, width: 150 },
    // { field: "total", headerName: dict.orders.total, width: 100 },
    // { field: "date", headerName: dict.orders.date, width: 180 },
    // { field: "status", headerName: dict.orders.status, width: 120 },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {/* {dict.orders.title} */}
      </Typography>
      <Box sx={{ height: 400, mt: 2 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[5, 10]}
          initialState={{
            pagination: { paginationModel: { pageSize: 5, page: 0 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default Orders;
