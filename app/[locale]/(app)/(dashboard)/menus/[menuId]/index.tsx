"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, Delete, Edit, ListAlt } from "@mui/icons-material";
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

import { useRouter } from "@/i18n/navigation";

import type { AdminMenu, AdminMenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

import CreateSectionDialog from "./CreateSectionDialog";
import UpdateSectionDialog from "./UpdateSectionDialog";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuDetailProps {
  menu: AdminMenu;
  initialSections: AdminMenuSection[];
}

const MenuId = ({ menu, initialSections }: MenuDetailProps) => {
  const { data: sections = initialSections, mutate: mutateSections } = useSWR<
    AdminMenuSection[]
  >(`/api/menus/${menu.id}/sections`, {
    fallbackData: initialSections,
  });

  const { setDialog } = useDialogStore((state) => state);
  const router = useRouter();
  const tMenus = useTranslations("menus");
  const format = useFormatter();
  const apiRef = useGridApiRef();

  const handleCreateSection = useCallback(() => {
    setDialog({
      content: (
        <CreateSectionDialog menuId={menu.id} onSuccess={mutateSections} />
      ),
      formId: "create-section-form",
      open: true,
      title: tMenus("sections.actions.createSection.title"),
    });
  }, [menu.id, mutateSections, setDialog, tMenus]);

  const handleUpdateSection = useCallback(
    (section: AdminMenuSection) => {
      setDialog({
        content: (
          <UpdateSectionDialog section={section} onSuccess={mutateSections} />
        ),
        formId: "update-section-form",
        open: true,
        title: tMenus("sections.actions.updateSection.title"),
      });
    },
    [mutateSections, setDialog, tMenus],
  );

  const handleDeleteSection = useCallback(
    ({ id, name }: AdminMenuSection) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("sections.actions.deleteSection.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menu-sections/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus("sections.actions.deleteSection.success", { name }),
              { variant: "success" },
            );

            mutateSections();
          } catch {
            enqueueSnackbar(tMenus("sections.actions.deleteSection.title"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tMenus("sections.actions.deleteSection.title"),
      });
    },
    [mutateSections, setDialog, tMenus],
  );

  const handleViewItems = useCallback(
    (section: AdminMenuSection) => {
      router.push(`/menus/${menu.id}/${section.id}/items`);
    },
    [menu.id, router],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tMenus("sections.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<AdminMenuSection>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tMenus("sections.actions.viewItems.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();
                  handleViewItems(row);
                }}
                size="small"
              >
                <ListAlt fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tMenus("sections.actions.updateSection.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();
                  handleUpdateSection(row);
                }}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tMenus("sections.actions.deleteSection.title")}>
              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteSection(row);
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
        headerName: tMenus("sections.name.label"),
        flex: 1,
      },
      {
        field: "description",
        headerName: tMenus("sections.description.label"),
        flex: 1,
        renderCell: ({ value }: GridRenderCellParams<AdminMenuSection>) =>
          value || "—",
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
    [format, handleDeleteSection, handleViewItems, handleUpdateSection, tMenus],
  );

  return (
    <Stack gap={2} flex={1} minHeight={0} overflow="hidden">
      <Stack direction="row" justifyContent="flex-end">
        <Button
          onClick={handleCreateSection}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tMenus("sections.actions.createSection.title")}
        </Button>
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        getRowClassName={({ indexRelativeToCurrentPage }) =>
          indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={sections}
      />
    </Stack>
  );
};

export default MenuId;
