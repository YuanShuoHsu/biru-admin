"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateMenuItemDialog from "./CreateMenuItemDialog";
import UpdateMenuItemDialog from "./UpdateMenuItemDialog";

import { DragHandle, Sortable } from "@/components/Sortable";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Add, Cancel, Delete, Edit, Save, Sort } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuItem } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenusMenuIdSectionIdProps {
  items: MenuItem[];
  rowCount: number;
  page: number;
  pageSize: number;
  sectionId: string;
}

const MenusMenuIdSectionId = ({
  items: initialItems,
  rowCount: initialRowCount,
  page,
  pageSize,
  sectionId,
}: MenusMenuIdSectionIdProps) => {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page,
    pageSize,
  });

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const swrKey = isReorderMode
    ? `/api/menu-sections/${sectionId}/menu-items`
    : `/api/menu-sections/${sectionId}/menu-items?limit=${paginationModel.pageSize}&offset=${(paginationModel.page - 1) * paginationModel.pageSize}`;

  const {
    data: { data: items, total: rowCount } = {
      data: initialItems,
      total: initialRowCount,
    },
    mutate: mutateItems,
    isValidating,
  } = useSWR<{ data: MenuItem[]; total: number }>(swrKey, {
    fallbackData: { data: initialItems, total: initialRowCount },
    keepPreviousData: true,
    revalidateOnFocus: false,
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

  const tMenus = useTranslations("menus");

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      const newPage = newModel.page + 1;
      setPaginationModel({ ...newModel, page: newPage });

      const params = new URLSearchParams({
        ...Object.fromEntries(searchParams),
        page: String(newPage),
        pageSize: String(newModel.pageSize),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("items.actions.reorderItem.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);
      },
      open: true,
      title: tMenus("items.actions.reorderItem.title"),
    });
  }, [setDialog, tMenus]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("items.actions.reorderItem.save.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/menu-sections/${sectionId}/menu-items/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: items.map(({ id }) => id) }),
          });

          setIsReorderMode(false);

          enqueueSnackbar(tMenus("items.actions.reorderItem.save.success"), {
            variant: "success",
          });
        } catch {
          enqueueSnackbar(tMenus("items.actions.reorderItem.save.error"), {
            variant: "error",
          });
        }
      },
      open: true,
      title: tMenus("items.actions.reorderItem.save.label"),
    });
  }, [items, sectionId, setDialog, tMenus]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("items.actions.reorderItem.cancel.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);
      },
      open: true,
      title: tMenus("items.actions.reorderItem.cancel.label"),
    });
  }, [setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const { page, pageSize } = apiRef.current?.state.pagination
      .paginationModel || { page: 0, pageSize: 10 };
    const offset = page * pageSize;
    const fromIndex = source.initialIndex + offset;
    const toIndex = source.index + offset;
    if (fromIndex === toIndex) return;

    const newItems = arrayMove(items, fromIndex, toIndex);
    mutateItems({ data: newItems, total: rowCount }, false);
  };

  const handleCreateItem = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuItemDialog mutateItems={mutateItems} sectionId={sectionId} />
      ),
      formId: "create-menu-item-form",
      open: true,
      title: tMenus("items.actions.createItem.title"),
    });
  }, [mutateItems, sectionId, setDialog, tMenus]);

  const handleUpdateItem = useCallback(
    (item: MenuItem) => {
      setDialog({
        content: <UpdateMenuItemDialog item={item} mutateItems={mutateItems} />,
        formId: "update-menu-item-form",
        open: true,
        title: tMenus("items.actions.updateItem.title"),
      });
    },
    [mutateItems, setDialog, tMenus],
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

            mutateItems();
          } catch {
            enqueueSnackbar(
              tMenus("items.actions.deleteItem.error", { name }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("items.actions.deleteItem.title"),
      });
    },
    [mutateItems, setDialog, tMenus],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(isReorderMode
        ? [
            {
              disableColumnMenu: true,
              field: "reorder",
              headerName: "",
              renderCell: () => <DragHandle />,
              resizable: false,
              sortable: false,
            },
          ]
        : []),
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
    [format, handleDeleteItem, handleUpdateItem, isReorderMode, tMenus],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
          <>
            <Button
              onClick={handleCreateItem}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tMenus("items.actions.createItem.title")}
            </Button>
            <Button
              disabled={rowCount < 2}
              onClick={handleEnterReorderMode}
              size="small"
              startIcon={<Sort />}
              variant="outlined"
            >
              {tMenus("items.actions.reorderItem.title")}
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleCancelReorder}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tMenus("items.actions.reorderItem.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("items.actions.reorderItem.save.label")}
            </Button>
          </>
        )}
      </Stack>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <DataGrid
          {...DATA_GRID_PROPS}
          apiRef={apiRef}
          columns={columns}
          loading={isValidating}
          {...(!isReorderMode && {
            onPaginationModelChange: handlePaginationModelChange,
            paginationMode: "server",
            paginationModel: {
              ...paginationModel,
              page: paginationModel.page - 1,
            },
            rowCount,
          })}
          rows={items}
          slots={{
            ...DATA_GRID_PROPS.slots,
            row: isReorderMode ? Sortable : undefined,
          }}
        />
      </DragDropProvider>
    </>
  );
};

export default MenusMenuIdSectionId;
