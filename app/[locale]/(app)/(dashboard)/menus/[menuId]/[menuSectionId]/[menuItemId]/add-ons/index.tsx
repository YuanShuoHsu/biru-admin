"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CreateAddOnDialog from "./CreateAddOnDialog";
import UpdateAddOnDialog from "./UpdateAddOnDialog";

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

import type { MenuItemAddOn } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuItemAddOnsProps {
  addOns: MenuItemAddOn[];
  canWrite: boolean;
  menuId: string;
  menuItemId: string;
}

const MenuItemAddOns = ({
  addOns: initialAddOns,
  canWrite,
  menuId,
  menuItemId,
}: MenuItemAddOnsProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const tMenus = useTranslations("menus");

  const apiRef = useGridApiRef();

  const { data: addOns = initialAddOns, mutate: mutateAddOns } = useSWR(
    `/api/menu-items/${menuItemId}/add-ons`,
    () => fetcher<MenuItemAddOn[]>(`/api/menu-items/${menuItemId}/add-ons`),
    {
      fallbackData: initialAddOns,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handleCreateAddOn = useCallback(() => {
    setDialog({
      content: (
        <CreateAddOnDialog
          menuId={menuId}
          menuItemId={menuItemId}
          mutateAddOns={mutateAddOns}
        />
      ),
      formId: "create-add-on-form",
      open: true,
      title: tMenus("addOns.actions.createAddOn.title"),
    });
  }, [menuId, menuItemId, mutateAddOns, setDialog, tMenus]);

  const handleUpdateAddOn = useCallback(
    (addOn: MenuItemAddOn) => {
      setDialog({
        content: (
          <UpdateAddOnDialog
            addOn={addOn}
            menuId={menuId}
            mutateAddOns={mutateAddOns}
          />
        ),
        formId: "update-add-on-form",
        open: true,
        title: tMenus("addOns.actions.updateAddOn.title"),
      });
    },
    [menuId, mutateAddOns, setDialog, tMenus],
  );

  const handleDeleteAddOn = useCallback(
    ({ id, addOnMenuItemName, addOnMenuSectionName }: MenuItemAddOn) => {
      const name = addOnMenuItemName || addOnMenuSectionName || "";

      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich(
              addOnMenuItemName
                ? "addOns.actions.deleteAddOn.confirm.menuItem"
                : "addOns.actions.deleteAddOn.confirm.menuSection",
              { bold: (chunks) => <strong>{chunks}</strong>, name },
            )}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menu-item-add-ons/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus(
                addOnMenuItemName
                  ? "addOns.actions.deleteAddOn.success.menuItem"
                  : "addOns.actions.deleteAddOn.success.menuSection",
                { name },
              ),
              { variant: "success" },
            );

            mutateAddOns();
          } catch {
            enqueueSnackbar(
              tMenus(
                addOnMenuItemName
                  ? "addOns.actions.deleteAddOn.error.menuItem"
                  : "addOns.actions.deleteAddOn.error.menuSection",
                { name },
              ),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("addOns.actions.deleteAddOn.title"),
      });
    },
    [mutateAddOns, setDialog, tMenus],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite
        ? [
            {
              disableColumnMenu: true,
              field: "actions",
              filterable: false,
              headerName: tMenus("addOns.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<MenuItemAddOn>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  <Tooltip title={tMenus("addOns.actions.updateAddOn.title")}>
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        handleUpdateAddOn(row);
                      }}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={tMenus("addOns.actions.deleteAddOn.title")}>
                    <IconButton
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteAddOn(row);
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
          ]
        : []),
      {
        field: "addOnMenuSectionName",
        headerName: tMenus("addOns.addOnMenuSectionId.label"),
        valueGetter: (
          _value: unknown,
          { addOnMenuSectionName, addOnMenuItemSectionName }: MenuItemAddOn,
        ) => addOnMenuSectionName || addOnMenuItemSectionName,
      },
      {
        field: "addOnMenuItemName",
        headerName: tMenus("addOns.addOnMenuItemId.label"),
        valueGetter: (_value: unknown, { addOnMenuItemName }: MenuItemAddOn) =>
          addOnMenuItemName,
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
    [canWrite, format, handleDeleteAddOn, handleUpdateAddOn, tMenus],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {canWrite && (
          <Button
            onClick={handleCreateAddOn}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tMenus("addOns.actions.createAddOn.title")}
          </Button>
        )}
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        rows={addOns}
      />
    </>
  );
};

export default MenuItemAddOns;
