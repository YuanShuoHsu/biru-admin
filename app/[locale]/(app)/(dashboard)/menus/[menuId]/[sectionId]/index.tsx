"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CreateMenuItemDialog from "./CreateMenuItemDialog";
import UpdateMenuItemDialog from "./UpdateMenuItemDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

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

import type { AdminMenuItem, AdminMenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenusMenuIdSectionIdProps {
  items: AdminMenuItem[];
  menuId: string;
  sectionId: string;
  sections: AdminMenuSection[];
}

const MenusMenuIdSectionId = ({
  items: initialItems,
  menuId,
  sectionId,
  sections: initialSections,
}: MenusMenuIdSectionIdProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const { data: sections = initialSections } = useSWR<AdminMenuSection[]>(
    `/api/menus/${menuId}/sections`,
    { fallbackData: initialSections },
  );

  const { data: rows = initialItems, mutate: mutateRows } = useSWR<
    AdminMenuItem[]
  >(`/api/menu-sections/${sectionId}/items`, { fallbackData: initialItems });

  const tMenus = useTranslations("menus");

  const selectedSection = useMemo(
    () => sections.find(({ id }) => id === sectionId),
    [sections, sectionId],
  );

  const handleCreateItem = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuItemDialog
          menuSectionId={sectionId}
          sections={sections}
          mutateRows={mutateRows}
        />
      ),
      formId: "create-menu-item-form",
      open: true,
      title: tMenus("items.actions.createItem.title"),
    });
  }, [mutateRows, sections, sectionId, setDialog, tMenus]);

  const handleUpdateItem = useCallback(
    (item: AdminMenuItem) => {
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
    ({ id, name }: AdminMenuItem) => {
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
        field: "actions",
        headerName: tMenus("items.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<AdminMenuItem>) => (
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
        flex: 1,
      },
      {
        field: "menuSectionId",
        headerName: tMenus("sections.label"),
        renderCell: ({ value }: GridRenderCellParams<AdminMenuItem>) =>
          value ? (selectedSection?.name ?? value) : "—",
        sortable: false,
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
    [format, handleDeleteItem, handleUpdateItem, selectedSection, tMenus],
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
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default MenusMenuIdSectionId;
