// https://mui.com/x/react-data-grid/overlays/
// https://mui.com/x/react-data-grid/components/#custom-slot-props-with-typescript

"use client";

import CustomNoRowsOverlay from "@/components/CustomNoRowsOverlay";
import ErrorAlert from "@/components/ErrorAlert";

import { GridOverlay, type GridSlotProps } from "@mui/x-data-grid";

declare module "@mui/x-data-grid" {
  interface NoRowsOverlayPropsOverrides {
    error?: unknown;
    onRetry?: () => void;
  }
}

const DataGridErrorOverlay = ({
  error,
  onRetry,
}: GridSlotProps["noRowsOverlay"]) =>
  error ? (
    <GridOverlay>
      <ErrorAlert onRetry={onRetry} />
    </GridOverlay>
  ) : (
    <CustomNoRowsOverlay />
  );

export default DataGridErrorOverlay;
