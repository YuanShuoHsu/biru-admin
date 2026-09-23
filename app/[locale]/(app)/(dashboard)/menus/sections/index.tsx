"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateMenuSectionDialog from "./CreateMenuSectionDialog";
import UpdateMenuSectionDialog from "./UpdateMenuSectionDialog";

import AuditLogButton from "@/components/AuditLogButton";
import { renderEmptyableCell } from "@/components/EmptyCell";
import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import {
  DEFAULT_PAGINATION_QUERY,
  getPageSizeOptions,
} from "@/constants/pagination";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { useRouter } from "@/i18n/navigation";

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
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Menu,
  MenuSection,
  MenuSectionFilterField,
  MenuSectionSortField,
} from "@/types/menus";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  isFilteredOrSorted,
} from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuDetailProps {
  canViewAuditLog: boolean;
  canWrite: boolean;
  filterField?: MenuSectionFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  menu: Menu;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: MenuSection[];
  sortBy?: MenuSectionSortField;
  sortDirection?: SortDirection;
}

const MenusMenuId = ({
  canViewAuditLog,
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  menu,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: MenuDetailProps) => {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items:
      initialFilterField &&
      initialFilterOperator &&
      (initialFilterValue ||
        NO_VALUE_FILTER_OPERATORS.includes(initialFilterOperator))
        ? [
            {
              field: initialFilterField,
              operator: initialFilterOperator,
              value:
                initialFilterOperator === "isAnyOf"
                  ? initialFilterValue?.split(",")
                  : initialFilterValue,
            },
          ]
        : [],
    quickFilterValues: initialQuickFilterValue ? [initialQuickFilterValue] : [],
  });

  const { setDialog } = useDialogStore((state) => state);

  const dateFilterOperators = useDateFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const router = useRouter();
  const searchParams = useSearchParams();
  const organization = searchParams.get("organization");

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const updateQuery = useUpdateQuery();

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      `/api/menus/${menu.id}/menu-sections`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () => {
      return fetcher<{ data: MenuSection[]; total: number }>(
        `/api/menus/${menu.id}/menu-sections?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      );
    },
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const isReorderDisabled =
    rowCount < 2 || isFilteredOrSorted(filterModel, sortModel);

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);

      updateQuery({
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
    },
    [updateQuery],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      updateQuery({
        page: "1",
        sortBy: newModel[0]?.field ?? "",
        sortDirection: newModel[0]?.sort ?? "",
      });
    },
    [updateQuery],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      const {
        filterField = "",
        filterOperator = "",
        filterValue = "",
      } = getFilterItemParams(newModel.items[0]);

      updateQuery({
        filterField,
        filterOperator,
        filterValue,
        page: "1",
        quickFilterValue: (newModel.quickFilterValues ?? []).join(" ").trim(),
      });
    },
    [updateQuery],
  );

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("sections.actions.reorderSection.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
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
          {tMenus.rich("sections.actions.reorderSection.save.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`/api/menus/${menu.id}/menu-sections/reorder`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: rows.map(({ id }) => id),
              offset: paginationModel.page * paginationModel.pageSize,
            }),
          });

          setIsReorderMode(false);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tMenus("sections.actions.reorderSection.save.success"),
            { variant: "success" },
          );
        } catch {
          mutate();

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
    mutate,
    paginationModel.page,
    paginationModel.pageSize,
    rows,
    setDialog,
    tMenus,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tMenus.rich("sections.actions.reorderSection.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);

        mutate();
      },
      open: true,
      title: tMenus("sections.actions.reorderSection.cancel.label"),
    });
  }, [mutate, setDialog, tMenus]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newSections = arrayMove(rows, fromIndex, toIndex);
    mutate({ data: newSections, total: rowCount }, false);
  };

  const handleCreateSection = useCallback(() => {
    setDialog({
      content: <CreateMenuSectionDialog menuId={menu.id} mutate={mutate} />,
      formId: "create-section-form",
      open: true,
      title: tMenus("sections.actions.createSection.title"),
    });
  }, [menu.id, mutate, setDialog, tMenus]);

  const handleViewSection = useCallback(
    (section: MenuSection) => {
      const searchParams = new URLSearchParams({
        ...(organization && { organization }),
        ...DEFAULT_PAGINATION_QUERY,
      });
      router.push(`/menus/sections/${section.id}?${searchParams.toString()}`);
    },
    [organization, router],
  );

  const handleUpdateSection = useCallback(
    (section: MenuSection) => {
      setDialog({
        content: <UpdateMenuSectionDialog section={section} mutate={mutate} />,
        formId: "update-section-form",
        open: true,
        title: tMenus("sections.actions.updateSection.title"),
      });
    },
    [mutate, setDialog, tMenus],
  );

  const handleDeleteSection = useCallback(
    ({ id, name }: MenuSection) => {
      const displayName = localize(name, locale);

      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("sections.actions.deleteSection.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: displayName,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menu-sections/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tMenus("sections.actions.deleteSection.success", {
                name: displayName,
              }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(
              tMenus("sections.actions.deleteSection.error", {
                name: displayName,
              }),
              { variant: "error" },
            );
          }
        },
        open: true,
        title: tMenus("sections.actions.deleteSection.title"),
      });
    },
    [locale, mutate, setDialog, tMenus],
  );

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
      ...(!isReorderMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tMenus("sections.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<MenuSection>) => (
                <ActionsStack direction="row">
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
                  {canWrite && (
                    <Tooltip
                      title={tMenus("sections.actions.updateSection.title")}
                    >
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
                  )}
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  {canWrite && (
                    <Tooltip
                      title={tMenus("sections.actions.deleteSection.title")}
                    >
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
                  )}
                </ActionsStack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tMenus("sections.name.label"),
        valueGetter: (_value: unknown, row: MenuSection) =>
          localize(row.name, locale),
      },
      {
        field: "description",
        filterOperators: stringFilterOperators,
        headerName: `${tMenus("sections.description.label")} ${tCommon("optional")}`,
        maxWidth: 320,
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, row: MenuSection) =>
          localize(row.description, locale),
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tMenus("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        filterOperators: dateFilterOperators,
        headerName: tMenus("updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      canViewAuditLog,
      canWrite,
      dateFilterOperators,
      format,
      handleDeleteSection,
      handleUpdateSection,
      handleViewSection,
      isReorderMode,
      locale,
      stringFilterOperators,
      tCommon,
      tMenus,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!isReorderMode ? (
          <>
            {canWrite && (
              <Button
                onClick={handleCreateSection}
                size="small"
                startIcon={<Add />}
                variant="contained"
              >
                {tMenus("sections.actions.createSection.title")}
              </Button>
            )}
            {canWrite && (
              <Button
                disabled={isReorderDisabled}
                onClick={handleEnterReorderMode}
                size="small"
                startIcon={<Sort />}
                variant="outlined"
              >
                {tMenus("sections.actions.reorderSection.title")}
              </Button>
            )}
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
      </ToolbarStack>
      <DragDropProvider onDragEnd={handleDragEnd}>
        <DataGrid
          {...DATA_GRID_PROPS}
          apiRef={apiRef}
          columns={columns}
          filterMode="server"
          filterModel={filterModel}
          loading={loading}
          onFilterModelChange={handleFilterModelChange}
          onPaginationModelChange={handlePaginationModelChange}
          onSortModelChange={handleSortModelChange}
          pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
          paginationMode="server"
          paginationModel={paginationModel}
          rowCount={rowCount}
          rows={rows}
          slots={{
            ...DATA_GRID_PROPS.slots,
            row: isReorderMode ? Sortable : undefined,
          }}
          sortingMode="server"
          sortModel={sortModel}
        />
      </DragDropProvider>
    </>
  );
};

export default MenusMenuId;
