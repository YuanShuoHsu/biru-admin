"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import BannerDialog from "./BannerDialog";

import { DragHandle, Sortable } from "@/components/Sortable";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import { arrayMove } from "@dnd-kit/helpers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortableOperation } from "@dnd-kit/react/sortable";

import {
  useBooleanFilterOperators,
  useDateFilterOperators,
} from "@/hooks/useFilterOperators";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Add, Cancel, Delete, Edit, Save, Sort } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
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

import type {
  Banner,
  BannerFilterField,
  BannerSortField,
} from "@/types/banners";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  getQuickFilterEnums,
  isFilteredOrSorted,
} from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(10),
  height: "auto",
  aspectRatio: "16/9",
}));

interface BannersProps {
  banners: Banner[];
  filterField?: BannerFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  sortBy?: BannerSortField;
  sortDirection?: SortDirection;
}

const Banners = ({
  banners: initialBanners,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  sortBy,
  sortDirection,
}: BannersProps) => {
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

  const booleanFilterOperators = useBooleanFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tBanners = useTranslations("banners");

  const enumOptions = useMemo(
    () => ({
      isActive: [
        { label: tBanners("isActive.active"), value: "true" },
        { label: tBanners("isActive.inactive"), value: "false" },
      ],
    }),
    [tBanners],
  );

  const {
    data: { data: banners, total: rowCount } = {
      data: initialBanners,
      total: initialRowCount,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    [
      "/api/banners",
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<{ data: Banner[]; total: number }>(
        `/api/banners?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
      ),
    {
      fallbackData: { data: initialBanners, total: initialRowCount },
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

      const params = new URLSearchParams(searchParams);
      params.set("page", String(newModel.page + 1));
      params.set("pageSize", String(newModel.pageSize));

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const sortItem = newModel[0];
      const params = new URLSearchParams(searchParams);
      params.delete("sortBy");
      params.delete("sortDirection");
      params.set("page", "1");
      if (sortItem?.field) params.set("sortBy", sortItem.field);
      if (sortItem?.sort) params.set("sortDirection", sortItem.sort);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const filterItem = newModel.items[0];
      const newQuickFilterValue = (newModel.quickFilterValues || [])
        .join(" ")
        .trim();
      const params = new URLSearchParams(searchParams);
      const { filterField, filterOperator, filterValue } =
        getFilterItemParams(filterItem);
      params.delete("filterField");
      params.delete("filterOperator");
      params.delete("filterValue");
      params.delete("quickFilterValue");
      params.delete("quickFilterEnums");
      params.set("page", "1");
      if (filterField) params.set("filterField", filterField);
      if (filterOperator) params.set("filterOperator", filterOperator);
      if (filterValue) params.set("filterValue", filterValue);
      if (newQuickFilterValue) {
        params.set("quickFilterValue", newQuickFilterValue);
        for (const entry of getQuickFilterEnums(
          newQuickFilterValue,
          enumOptions,
        ))
          params.append("quickFilterEnums", entry);
      }

      router.replace(`${pathname}?${params.toString()}`);
    },
    [enumOptions, pathname, router, searchParams],
  );

  const handleEnterReorderMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tBanners.rich("actions.reorderBanner.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tBanners("actions.reorderBanner.title"),
    });
  }, [apiRef, setDialog, tBanners]);

  const handleSaveReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tBanners.rich("actions.reorderBanner.save.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher("/api/banners/reorder", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids: banners.map(({ id }) => id),
              offset: paginationModel.page * paginationModel.pageSize,
            }),
          });

          setIsReorderMode(false);

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(tBanners("actions.reorderBanner.save.success"), {
            variant: "success",
          });
        } catch {
          mutate();

          enqueueSnackbar(tBanners("actions.reorderBanner.save.error"), {
            variant: "error",
          });
        }
      },
      open: true,
      title: tBanners("actions.reorderBanner.save.label"),
    });
  }, [
    apiRef,
    banners,
    mutate,
    paginationModel.page,
    paginationModel.pageSize,
    setDialog,
    tBanners,
  ]);

  const handleCancelReorder = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tBanners.rich("actions.reorderBanner.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsReorderMode(false);

        mutate();
      },
      open: true,
      title: tBanners("actions.reorderBanner.cancel.label"),
    });
  }, [mutate, setDialog, tBanners]);

  const handleDragEnd = ({ operation }: DragEndEvent) => {
    if (!isSortableOperation(operation)) return;

    const { canceled, source } = operation;
    if (canceled || !source) return;

    const fromIndex = source.initialIndex;
    const toIndex = source.index;
    if (fromIndex === toIndex) return;

    const newBanners = arrayMove(banners, fromIndex, toIndex);
    mutate({ data: newBanners, total: rowCount }, false);
  };

  const handleCreateBanner = useCallback(() => {
    setDialog({
      content: <BannerDialog banner={null} mutate={mutate} />,
      formId: "banner-form",
      open: true,
      title: tBanners("actions.createBanner.title"),
    });
  }, [mutate, setDialog, tBanners]);

  const handleUpdateBanner = useCallback(
    (banner: Banner) => {
      setDialog({
        content: <BannerDialog banner={banner} mutate={mutate} />,
        formId: "banner-form",
        open: true,
        title: tBanners("actions.updateBanner.title"),
      });
    },
    [mutate, setDialog, tBanners],
  );

  const handleDeleteBanner = useCallback(
    ({ id }: Banner) => {
      setDialog({
        content: (
          <DialogContentText>
            {tBanners.rich("actions.deleteBanner.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/banners/${id}`, { method: "DELETE" });

            enqueueSnackbar(tBanners("actions.deleteBanner.success"), {
              variant: "success",
            });

            mutate();
          } catch {
            enqueueSnackbar(tBanners("actions.deleteBanner.error"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tBanners("actions.deleteBanner.title"),
      });
    },
    [mutate, setDialog, tBanners],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(isReorderMode
        ? [
            {
              disableColumnMenu: true,
              field: "reorder",
              filterable: false,
              headerName: tBanners("reorder"),
              renderCell: () => <DragHandle />,
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        disableColumnMenu: true,
        field: "actions",
        filterable: false,
        headerName: tBanners("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Banner>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tBanners("actions.updateBanner.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  handleUpdateBanner(row);
                }}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tBanners("actions.deleteBanner.title")}>
              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();

                  handleDeleteBanner(row);
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
        disableColumnMenu: true,
        field: "image",
        filterable: false,
        headerName: tBanners("image.label"),
        renderCell: ({ row: { image } }: GridRenderCellParams<Banner>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <StyledAvatar
              alt={tBanners("image.label")}
              src={image}
              variant="rounded"
            />
          </Stack>
        ),
        sortable: false,
      },
      {
        field: "isActive",
        filterOperators: booleanFilterOperators,
        headerName: tBanners("isActive.label"),
        renderCell: ({ row: { isActive } }: GridRenderCellParams<Banner>) => (
          <Chip
            color={isActive ? "success" : "default"}
            label={tBanners(isActive ? "isActive.active" : "isActive.inactive")}
            size="small"
            variant="outlined"
          />
        ),
        type: "boolean",
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tBanners("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "updatedAt",
        filterOperators: dateFilterOperators,
        headerName: tBanners("updatedAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      booleanFilterOperators,
      dateFilterOperators,
      format,
      handleDeleteBanner,
      handleUpdateBanner,
      isReorderMode,
      tBanners,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {!isReorderMode ? (
          <>
            <Button
              onClick={handleCreateBanner}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tBanners("actions.createBanner.title")}
            </Button>
            <Button
              disabled={isReorderDisabled}
              onClick={handleEnterReorderMode}
              size="small"
              startIcon={<Sort />}
              variant="outlined"
            >
              {tBanners("actions.reorderBanner.title")}
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
              {tBanners("actions.reorderBanner.cancel.label")}
            </Button>
            <Button
              onClick={handleSaveReorder}
              size="small"
              startIcon={<Save />}
              variant="contained"
            >
              {tBanners("actions.reorderBanner.save.label")}
            </Button>
          </>
        )}
      </Stack>
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
          rows={banners}
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

export default Banners;
