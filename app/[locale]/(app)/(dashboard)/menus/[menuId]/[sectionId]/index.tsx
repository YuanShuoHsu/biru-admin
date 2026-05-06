"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CreateMenuItemDialog from "./CreateMenuItemDialog";
import UpdateMenuItemDialog from "./UpdateMenuItemDialog";

import { DragHandle, Sortable } from "@/components/Sortable";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuItem, MenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenusMenuIdSectionIdProps {
  items: MenuItem[];
  sections: MenuSection[];
  sectionId: string;
}

const MenusMenuIdSectionId = ({
  items: initialItems,
  sectionId,
}: MenusMenuIdSectionIdProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const {
    data: rows = initialItems,
    mutate: mutateRows,
    isValidating,
  } = useSWR<MenuItem[]>(`/api/menu-sections/${sectionId}/menu-items`, {
    fallbackData: initialItems,
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

  const tMenus = useTranslations("menus");

  const handleDragEnd = (event: DragEndEvent) => {
    if (!isSortableOperation(event.operation)) return;

    const { source, canceled } = event.operation;
    if (!source || canceled) return;

    const fromIndex = rows.findIndex(({ id }) => id === source.id);
    if (fromIndex === -1) return;

    const { page, pageSize } = apiRef.current?.state.pagination
      .paginationModel || {
      page: 0,
      pageSize: 10,
    };
    const toIndex = source.index + page * pageSize;
    if (fromIndex === toIndex) return;

    const { name } = rows[fromIndex];
    const newRows = arrayMove(rows, fromIndex, toIndex);
    mutateRows(newRows, false);

    fetcher(`/api/menu-sections/${sectionId}/menu-items/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newRows.map(({ id }) => id) }),
    })
      .then(() => {
        enqueueSnackbar(tMenus("items.actions.reorderItem.success", { name }), {
          variant: "success",
        });
      })
      .catch(() => {
        enqueueSnackbar(tMenus("items.actions.reorderItem.error", { name }), {
          variant: "error",
        });

        mutateRows(rows, false);
      });
  };

  const handleCreateItem = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuItemDialog mutateRows={mutateRows} sectionId={sectionId} />
      ),
      formId: "create-menu-item-form",
      open: true,
      title: tMenus("items.actions.createItem.title"),
    });
  }, [mutateRows, sectionId, setDialog, tMenus]);

  const handleUpdateItem = useCallback(
    (item: MenuItem) => {
      setDialog({
        content: <UpdateMenuItemDialog item={item} mutateRows={mutateRows} />,
        formId: "update-menu-item-form",
        open: true,
        title: tMenus("items.actions.updateItem.title"),
      });
    },
    [mutateRows, setDialog, tMenus],
  );

  const handleDeleteItem = useCallback(
    ({ id, name }: MenuItem) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("items.actions.deleteItem.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menu-items/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus("items.actions.deleteItem.success", { name }),
              { variant: "success" },
            );

            mutateRows();
          } catch {
            enqueueSnackbar(tMenus("items.actions.deleteItem.title"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tMenus("items.actions.deleteItem.title"),
      });
    },
    [mutateRows, setDialog, tMenus],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "reorder",
        headerName: "",
        renderCell: () => <DragHandle />,
        resizable: false,
        sortable: false,
      },
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tMenus("items.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<MenuItem>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tMenus("items.actions.updateItem.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  handleUpdateItem(row);
                }}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tMenus("items.actions.deleteItem.title")}>
              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();

                  handleDeleteItem(row);
                }}
                size="small"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        headerName: tMenus("items.name.label"),
      },
      {
        field: "createdAt",
        headerName: tMenus("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        headerName: tMenus("updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [format, handleDeleteItem, handleUpdateItem, tMenus],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        <Button
          onClick={handleCreateItem}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tMenus("items.actions.createItem.title")}
        </Button>
      </Stack>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <DataGrid
          {...DATA_GRID_PROPS}
          apiRef={apiRef}
          columns={columns}
          loading={isValidating}
          onPaginationModelChange={() => {
            apiRef.current?.autosizeColumns(autosizeOptions);
          }}
          rows={rows}
          slots={{
            ...DATA_GRID_PROPS.slots,
            row: Sortable,
          }}
        />
      </DragDropProvider>
    </>
  );
};

export default MenusMenuIdSectionId;
