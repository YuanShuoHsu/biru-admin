"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateMenuSectionDialog from "./CreateMenuSectionDialog";
import UpdateMenuSectionDialog from "./UpdateMenuSectionDialog";

import { DragHandle, Sortable } from "@/components/Sortable";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  Add,
  Cancel,
  Delete,
  Edit,
  ListAlt,
  Save,
  Sort,
} from "@mui/icons-material";
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

import type { Menu, MenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuDetailProps {
  menu: Menu;
  sections: MenuSection[];
  rowCount: number;
  page: number;
  pageSize: number;
}

const MenusMenuId = ({
  menu,
  sections: initialSections,
  rowCount: initialRowCount,
  page,
  pageSize,
}: MenuDetailProps) => {
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
  const organization = searchParams.get("organization");

  const swrKey = `/api/menus/${menu.id}/menu-sections?limit=${paginationModel.pageSize}&offset=${(paginationModel.page - 1) * paginationModel.pageSize}`;

  const {
    data: { data: sections, total: rowCount } = {
      data: initialSections,
      total: initialRowCount,
    },
    mutate: mutateSections,
    isValidating,
  } = useSWR<{ data: MenuSection[]; total: number }>(swrKey, {
    fallbackData: { data: initialSections, total: initialRowCount },
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
          {tMenus("sections.actions.reorderSection.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tMenus("sections.actions.reorderSection.title"),
    });
  }, [apiRef, setDialog, tMenus]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("sections.actions.reorderSection.save.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/menus/${menu.id}/menu-sections/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: sections.map(({ id }) => id),
              offset: (paginationModel.page - 1) * paginationModel.pageSize,
            }),
          });

          setIsReorderMode(false);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tMenus("sections.actions.reorderSection.save.success"),
            { variant: "success" },
          );
        } catch {
          mutateSections();

          enqueueSnackbar(
            tMenus("sections.actions.reorderSection.save.error"),
            { variant: "error" },
          );
        }
      },
      open: true,
      title: tMenus("sections.actions.reorderSection.save.label"),
    });
  }, [
    apiRef,
    menu.id,
    mutateSections,
    paginationModel.page,
    paginationModel.pageSize,
    sections,
    setDialog,
    tMenus,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus("sections.actions.reorderSection.cancel.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);

        mutateSections();
      },
      open: true,
      title: tMenus("sections.actions.reorderSection.cancel.label"),
    });
  }, [mutateSections, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newSections = arrayMove(sections, fromIndex, toIndex);
    mutateSections({ data: newSections, total: rowCount }, false);
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

  const handleViewSection = useCallback(
    (section: MenuSection) => {
      const searchParams = new URLSearchParams({
        ...(organization ? { organization } : {}),
        page: "1",
        pageSize: "10",
      });
      router.push(`/menus/${menu.id}/${section.id}?${searchParams.toString()}`);
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
            enqueueSnackbar(
              tMenus("sections.actions.deleteSection.error", { name }),
              { variant: "error" },
            );
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
        headerName: tMenus("sections.actions.label"),
        renderCell: ({ row }: GridRenderCellParams<MenuSection>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tMenus("sections.actions.viewItems.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  handleViewSection(row);
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
    [
      format,
      handleDeleteSection,
      handleViewSection,
      handleUpdateSection,
      isReorderMode,
      tMenus,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
          <>
            <Button
              onClick={handleCreateSection}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tMenus("sections.actions.createSection.title")}
            </Button>
            <Button
              disabled={rowCount < 2}
              onClick={handleEnterReorderMode}
              size="small"
              startIcon={<Sort />}
              variant="outlined"
            >
              {tMenus("sections.actions.reorderSection.title")}
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
              {tMenus("sections.actions.reorderSection.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tMenus("sections.actions.reorderSection.save.label")}
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
          onPaginationModelChange={handlePaginationModelChange}
          paginationMode="server"
          paginationModel={{
            ...paginationModel,
            page: paginationModel.page - 1,
          }}
          rowCount={rowCount}
          rows={sections}
          slots={{
            ...DATA_GRID_PROPS.slots,
            row: isReorderMode ? Sortable : undefined,
          }}
        />
      </DragDropProvider>
    </>
  );
};

export default MenusMenuId;
