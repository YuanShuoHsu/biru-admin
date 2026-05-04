"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, ArrowBack, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminMenuItem, AdminMenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

import CreateMenuItemDialog from "./CreateMenuItemDialog";
import UpdateMenuItemDialog from "./UpdateMenuItemDialog";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface ItemsPanelProps {
  sections: AdminMenuSection[];
  items: AdminMenuItem[];
  selectedSectionId: string | null;
  onBack: () => void;
  onMutate: () => unknown;
}

const ItemsPanel = ({
  sections,
  items,
  selectedSectionId,
  onBack,
  onMutate,
}: ItemsPanelProps) => {
  const { setDialog } = useDialogStore((state) => state);
  const tMenus = useTranslations("menus");
  const format = useFormatter();
  const apiRef = useGridApiRef();

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId),
    [sections, selectedSectionId],
  );

  const filteredItems = useMemo(() => {
    if (!selectedSectionId) return [];
    return items.filter((i) => i.menuSectionId === selectedSectionId);
  }, [items, selectedSectionId]);

  const handleCreateItem = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuItemDialog
          menuSectionId={selectedSectionId}
          sections={sections}
          onSuccess={onMutate}
        />
      ),
      formId: "create-menu-item-form",
      open: true,
      title: tMenus("items.actions.createItem.title"),
    });
  }, [onMutate, sections, selectedSectionId, setDialog, tMenus]);

  const handleUpdateItem = useCallback(
    (item: AdminMenuItem) => {
      setDialog({
        content: <UpdateMenuItemDialog item={item} onSuccess={onMutate} />,
        formId: "update-menu-item-form",
        open: true,
        title: tMenus("items.actions.updateItem.title"),
      });
    },
    [onMutate, setDialog, tMenus],
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

            onMutate();
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
    [onMutate, setDialog, tMenus],
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
                onClick={(e) => {
                  e.stopPropagation();
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
                onClick={(e) => {
                  e.stopPropagation();
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
    <Stack flex={1} minWidth={0} gap={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" gap={1}>
          <Tooltip title={tMenus("sections.actions.backToSections.title")}>
            <IconButton onClick={onBack} size="small">
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="subtitle2">
            {selectedSection
              ? `${selectedSection.name} ${tMenus("items.label")}`
              : tMenus("items.label")}
          </Typography>
        </Stack>
        <Button
          disabled={!selectedSectionId}
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
        rows={filteredItems}
      />
    </Stack>
  );
};

export default ItemsPanel;
