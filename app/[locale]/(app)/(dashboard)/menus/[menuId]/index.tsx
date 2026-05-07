"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CreateMenuSectionDialog from "./CreateMenuSectionDialog";
import UpdateMenuSectionDialog from "./UpdateMenuSectionDialog";

import { DragHandle, Sortable } from "@/components/Sortable";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

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

import type { Menu, MenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuDetailProps {
  menu: Menu;
  sections: MenuSection[];
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
  } = useSWR<MenuSection[]>(`/api/menus/${menu.id}/menu-sections`, {
    fallbackData: initialSections,
    revalidateOnFocus: false,
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

  const tMenus = useTranslations("menus");

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

    const { name } = sections[fromIndex];
    const newSections = arrayMove(sections, fromIndex, toIndex);
    mutateSections(newSections, false);

    fetcher(`/api/menus/${menu.id}/menu-sections/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: newSections.map(({ id }) => id) }),
    })
      .then(() => {
        enqueueSnackbar(
          tMenus("sections.actions.reorderSection.success", { name }),
          { variant: "success" },
        );
      })
      .catch(() => {
        enqueueSnackbar(
          tMenus("sections.actions.reorderSection.error", { name }),
          { variant: "error" },
        );

        mutateSections();
      });
  };

  const handleCreateSection = useCallback(() => {
    setDialog({
      content: (
        <CreateMenuSectionDialog
          menuId={menu.id}
          mutateSections={mutateSections}
        />
      ),
      formId: "create-section-form",
      open: true,
      title: tMenus("sections.actions.createSection.title"),
    });
  }, [menu.id, mutateSections, setDialog, tMenus]);

  const handleViewItems = useCallback(
    (section: MenuSection) => {
      router.push(
        `/menus/${menu.id}/${section.id}${organization ? `?organization=${organization}` : ""}`,
      );
    },
    [menu.id, organization, router],
  );

  const handleUpdateSection = useCallback(
    (section: MenuSection) => {
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
    ({ id, name }: MenuSection) => {
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
        field: "reorder",
        headerName: "",
        renderCell: () => <DragHandle />,
        resizable: false,
        sortable: false,
      },
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tMenus("sections.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<MenuSection>) => (
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
      },
      {
        field: "description",
        headerName: tMenus("sections.description.label"),
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
      <DragDropProvider onDragEnd={handleDragEnd}>
        <DataGrid
          {...DATA_GRID_PROPS}
          apiRef={apiRef}
          columns={columns}
          loading={isValidating}
          onPaginationModelChange={() =>
            apiRef.current?.autosizeColumns(autosizeOptions)
          }
          rows={sections}
          slots={{
            ...DATA_GRID_PROPS.slots,
            row: Sortable,
          }}
        />
      </DragDropProvider>
    </>
  );
};

export default MenusMenuId;
