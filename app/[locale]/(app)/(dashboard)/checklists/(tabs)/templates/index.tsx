"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import ChecklistTemplateDialog from "./ChecklistTemplateDialog";

import DataGrid from "@/components/DataGrid";
import { DragHandle, Sortable } from "@/components/Sortable";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import { Add, Cancel, Delete, Edit, Save, Sort } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridFilterModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ChecklistTemplate } from "@/types/checklists";
import type { ToolbarMode } from "@/types/dataGrid";

import { isFilteredOrSorted } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface ChecklistTemplatesProps {
  closed: boolean;
  organizationSlug: string;
}

const ChecklistTemplates = ({
  closed,
  organizationSlug,
}: ChecklistTemplatesProps) => {
  const [toolbarMode, setToolbarMode] = useState<ToolbarMode>(null);
  const isReorderMode = toolbarMode === "reorder";
  const [draftRows, setDraftRows] = useState<ChecklistTemplate[] | null>(null);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tChecklists = useTranslations("checklists.templates");

  const templatesUrl = `/api/organizations/${organizationSlug}/checklists/templates`;

  const {
    data: fetchedRows = [],
    isValidating,
    mutate,
  } = useSWR<ChecklistTemplate[]>(templatesUrl, {
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

  const rows = draftRows ?? fetchedRows;

  const isReorderDisabled =
    closed ||
    rows.length < 2 ||
    isValidating ||
    isFilteredOrSorted(filterModel, sortModel);

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tChecklists.rich("actions.reorder.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setDraftRows(rows);
        setToolbarMode("reorder");
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tChecklists("actions.reorder.title"),
    });
  }, [apiRef, rows, setDialog, tChecklists]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tChecklists.rich("actions.reorder.save.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`${templatesUrl}/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: rows.map(({ id }) => id) }),
          });

          mutate(rows);
          setDraftRows(null);
          setToolbarMode(null);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(tChecklists("actions.reorder.save.success"), {
            variant: "success",
          });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        }
      },
      open: true,
      title: tChecklists("actions.reorder.save.label"),
    });
  }, [apiRef, mutate, rows, setDialog, tChecklists, templatesUrl]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tChecklists.rich("actions.reorder.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setDraftRows(null);
        setToolbarMode(null);
      },
      open: true,
      title: tChecklists("actions.reorder.cancel.label"),
    });
  }, [setDialog, tChecklists]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    setDraftRows(arrayMove(rows, fromIndex, toIndex));
  };

  const handleTemplateDialog = useCallback(
    (template?: ChecklistTemplate) =>
      setDialog({
        content: (
          <ChecklistTemplateDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            template={template}
          />
        ),
        formId: "checklist-template-form",
        open: true,
        title: tChecklists(
          template ? "actions.update.title" : "actions.create.title",
        ),
      }),
    [mutate, organizationSlug, setDialog, tChecklists],
  );

  const handleRemove = useCallback(
    ({ id, name }: ChecklistTemplate) =>
      setDialog({
        content: (
          <DialogContentText>
            {tChecklists.rich("actions.remove.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`${templatesUrl}/${id}`, { method: "DELETE" });

            enqueueSnackbar(tChecklists("actions.remove.success"), {
              variant: "success",
            });
          } finally {
            await mutate();
          }
        },
        open: true,
        title: tChecklists("actions.remove.title"),
      }),
    [mutate, setDialog, tChecklists, templatesUrl],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      isReorderMode
        ? {
            disableColumnMenu: true,
            field: "reorder",
            filterable: false,
            headerName: tChecklists("reorder"),
            renderCell: () => <DragHandle />,
            resizable: false,
            sortable: false,
          }
        : {
            disableColumnMenu: true,
            disableExport: true,
            field: "actions",
            filterable: false,
            headerName: tChecklists("actions.label"),
            renderCell: ({ row }: GridRenderCellParams<ChecklistTemplate>) => (
              <ActionsStack direction="row">
                <Tooltip title={tChecklists("actions.update.title")}>
                  <span>
                    <IconButton
                      aria-label={tChecklists("actions.update.title")}
                      disabled={closed}
                      onClick={() => handleTemplateDialog(row)}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={tChecklists("actions.remove.title")}>
                  <span>
                    <IconButton
                      aria-label={tChecklists("actions.remove.title")}
                      color="error"
                      disabled={closed}
                      onClick={() => handleRemove(row)}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </ActionsStack>
            ),
            resizable: false,
            sortable: false,
          },
      { field: "name", headerName: tChecklists("name") },
      {
        field: "timing",
        headerName: tChecklists("timing.label"),
        valueFormatter: (value: ChecklistTemplate["timing"]) =>
          tChecklists(`timing.${value}`),
      },
      { field: "enabled", headerName: tChecklists("enabled"), type: "boolean" },
      {
        field: "items",
        headerName: tChecklists("items.label"),
        valueGetter: (value: ChecklistTemplate["items"]) =>
          value.map(({ label }) => label).join(tCommon("delimiter")),
      },
    ],
    [
      closed,
      handleRemove,
      handleTemplateDialog,
      isReorderMode,
      tChecklists,
      tCommon,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {isReorderMode ? (
          <>
            <Button
              onClick={handleCancelReorder}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tChecklists("actions.reorder.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tChecklists("actions.reorder.save.label")}
            </Button>
          </>
        ) : (
          <>
            <Button
              disabled={closed}
              onClick={() => handleTemplateDialog()}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tChecklists("actions.create.title")}
            </Button>
            <Button
              disabled={isReorderDisabled}
              onClick={handleEnterReorderMode}
              size="small"
              startIcon={<Sort />}
              variant="outlined"
            >
              {tChecklists("actions.reorder.title")}
            </Button>
          </>
        )}
      </ToolbarStack>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <DataGrid
          {...DATA_GRID_PROPS}
          apiRef={apiRef}
          columns={columns}
          disableColumnFilter={isReorderMode}
          disableColumnSorting={isReorderMode}
          filterModel={filterModel}
          loading={isValidating}
          onFilterModelChange={setFilterModel}
          onPaginationModelChange={() =>
            apiRef.current?.autosizeColumns(autosizeOptions)
          }
          onSortModelChange={setSortModel}
          rows={rows}
          slots={{
            ...DATA_GRID_PROPS.slots,
            row: isReorderMode ? Sortable : undefined,
          }}
          sortModel={sortModel}
        />
      </DragDropProvider>
    </>
  );
};

export default ChecklistTemplates;
