"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateAddOnDialog from "./CreateAddOnDialog";
import UpdateAddOnDialog from "./UpdateAddOnDialog";

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
  const [isReorderMode, setIsReorderMode] = useState(false);

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
          addOns={addOns}
          menuId={menuId}
          menuItemId={menuItemId}
          mutateAddOns={mutateAddOns}
        />
      ),
      formId: "create-add-on-form",
      open: true,
      title: tMenus("addOns.actions.createAddOn.title"),
    });
  }, [addOns, menuId, menuItemId, mutateAddOns, setDialog, tMenus]);

  const handleUpdateAddOn = useCallback(
    (addOn: MenuItemAddOn) => {
      setDialog({
        content: (
          <UpdateAddOnDialog
            addOn={addOn}
            addOns={addOns}
            menuId={menuId}
            mutateAddOns={mutateAddOns}
          />
        ),
        formId: "update-add-on-form",
        open: true,
        title: tMenus("addOns.actions.updateAddOn.title"),
      });
    },
    [addOns, menuId, mutateAddOns, setDialog, tMenus],
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

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("addOns.actions.reorderAddOn.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMenus("addOns.actions.reorderAddOn.title"),
    });
  }, [apiRef, setDialog, tMenus]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("addOns.actions.reorderAddOn.save.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/menu-items/${menuItemId}/add-ons/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: addOns.map(({ id }) => id),
              offset: 0,
            }),
          });

          setIsReorderMode(false);
          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(tMenus("addOns.actions.reorderAddOn.save.success"), {
            variant: "success",
          });
        } catch {
          mutateAddOns();

          enqueueSnackbar(tMenus("addOns.actions.reorderAddOn.save.error"), {
            variant: "error",
          });
        }
      },
      open: true,
      title: tMenus("addOns.actions.reorderAddOn.save.label"),
    });
  }, [addOns, apiRef, menuItemId, mutateAddOns, setDialog, tMenus]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("addOns.actions.reorderAddOn.cancel.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);
        mutateAddOns();
      },
      open: true,
      title: tMenus("addOns.actions.reorderAddOn.cancel.label"),
    });
  }, [mutateAddOns, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newAddOns = arrayMove(addOns, fromIndex, toIndex);
    mutateAddOns(newAddOns, false);
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(isReorderMode
        ? [
            {
              disableColumnMenu: true,
              field: "reorder",
              filterable: false,
              headerName: tMenus("reorder"),
              renderCell: () => <DragHandle />,
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      ...(canWrite && !isReorderMode
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
    [
      canWrite,
      format,
      handleDeleteAddOn,
      handleUpdateAddOn,
      isReorderMode,
      tMenus,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
          canWrite && (
            <>
              <Button
                onClick={handleCreateAddOn}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tMenus("addOns.actions.createAddOn.title")}
              </Button>
              <Button
                disabled={addOns.length < 2}
                onClick={handleEnterReorderMode}
                size="small"
                startIcon={<Sort />}
                variant="outlined"
              >
                {tMenus("addOns.actions.reorderAddOn.title")}
              </Button>
            </>
          )
        ) : (
          <>
            <Button
              onClick={handleCancelReorder}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tMenus("addOns.actions.reorderAddOn.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("addOns.actions.reorderAddOn.save.label")}
            </Button>
          </>
        )}
      </Stack>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <DataGrid
          {...DATA_GRID_PROPS}
          apiRef={apiRef}
          columns={columns}
          rows={addOns}
          slots={{
            ...DATA_GRID_PROPS.slots,
            row: isReorderMode ? Sortable : undefined,
          }}
        />
      </DragDropProvider>
    </>
  );
};

export default MenuItemAddOns;
