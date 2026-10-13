"use client";

import { useCallback, useMemo, useState } from "react";

import type { GridRowParams, GridRowSelectionModel } from "@mui/x-data-grid";

const emptySelection: GridRowSelectionModel = {
  ids: new Set(),
  type: "include",
};

const rowIdOf = (row: object) => String(Reflect.get(row, "id"));

interface UseRowSelectionOptions<Row> {
  enabled: boolean;
  getRowId?: (row: Row) => string;
  isRowSelectable?: (row: Row) => boolean;
  rows: Row[];
}

export const useRowSelection = <Row extends object>({
  enabled,
  getRowId = rowIdOf,
  isRowSelectable,
  rows,
}: UseRowSelectionOptions<Row>) => {
  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>(emptySelection);

  const selectedRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          rowSelectionModel.ids.has(getRowId(row)) ===
            (rowSelectionModel.type === "include") &&
          (isRowSelectable?.(row) ?? true),
      ),
    [getRowId, isRowSelectable, rowSelectionModel, rows],
  );

  const hasSelectableRows = useMemo(
    () => rows.some((row) => isRowSelectable?.(row) ?? true),
    [isRowSelectable, rows],
  );

  const clearRowSelection = useCallback(
    () => setRowSelectionModel(emptySelection),
    [],
  );

  const rowSelectionProps = useMemo(() => {
    const rowsById = new Map(rows.map((row) => [getRowId(row), row]));

    return {
      checkboxSelection: enabled,
      isRowSelectable: isRowSelectable
        ? ({ id }: GridRowParams) => {
            const row = rowsById.get(String(id));

            return !!row && isRowSelectable(row);
          }
        : undefined,
      onRowSelectionModelChange: setRowSelectionModel,
      rowSelectionModel,
    };
  }, [enabled, getRowId, isRowSelectable, rowSelectionModel, rows]);

  return {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  };
};
