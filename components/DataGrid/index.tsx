"use client";

import dynamic from "next/dynamic";

import DataGridSkeleton from "@/components/DataGridSkeleton";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { loading: () => <DataGridSkeleton />, ssr: false },
);

export default DataGrid;
