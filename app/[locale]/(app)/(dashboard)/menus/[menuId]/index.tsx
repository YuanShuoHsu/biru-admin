"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CreateMenuSectionDialog from "./CreateMenuSectionDialog";
import UpdateMenuSectionDialog from "./UpdateMenuSectionDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

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

import type { AdminMenu, AdminMenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuDetailProps {
  menu: AdminMenu;
  sections: AdminMenuSection[];
}

const MenusMenuId = ({ menu, sections: initialSections }: MenuDetailProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const router = useRouter();

  const searchParams = useSearchParams();
  const organization = searchParams.get("organization");

  const {
    data: sections = initialSections,
    mutate: mutateSections,
    isValidating,
  } = useSWR<AdminMenuSection[]>(`/api/menus/${menu.id}/sections`, {
    fallbackData: initialSections,
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

  const tMenus = useTranslations("menus");

  const handleCreateSection = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuSectionDialog menuId={menu.id} mutateSections={mutateSections} />
      ),
      formId: "create-section-form",
      open: true,
      title: tMenus("sections.actions.createSection.title"),
    });
  }, [menu.id, mutateSections, setDialog, tMenus]);

  const handleViewItems = useCallback(
    (section: AdminMenuSection) => {
      router.push(
        `/menus/${menu.id}/${section.id}${organization ? `?organization=${organization}` : ""}`,
      );
    },
    [menu.id, organization, router],
  );

  const handleUpdateSection = useCallback(
    (section: AdminMenuSection) => {
      setDialog({
        content: (
          <UpdateMenuSectionDialog
            section={section}
            mutateSections={mutateSections}
          />
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
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
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
        loading={isValidating}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={sections}
      />
    </>
  );
};

export default MenusMenuId;
