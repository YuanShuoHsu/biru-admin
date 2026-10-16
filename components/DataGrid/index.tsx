"use client";

import dynamic from "next/dynamic";
import { createContext, use } from "react";

import DataGridSkeleton, {
  type DataGridSkeletonProps,
} from "@/components/DataGridSkeleton";

const SkeletonPropsContext = createContext<DataGridSkeletonProps>({});

const DataGridLoading = () => (
  <DataGridSkeleton {...use(SkeletonPropsContext)} />
);

const LazyDataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { loading: DataGridLoading, ssr: false },
);

const DataGrid = (props: React.ComponentProps<typeof LazyDataGrid>) => (
  <SkeletonPropsContext value={props}>
    <LazyDataGrid {...props} />
  </SkeletonPropsContext>
);

export default DataGrid;
