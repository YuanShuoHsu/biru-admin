"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CouponDialog from "./CouponDialog";
import GrantCouponDialog from "./GrantCouponDialog";

import AuditLogButton from "@/components/AuditLogButton";
import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import {
  DEFAULT_PAGINATION_QUERY,
  getPageSizeOptions,
} from "@/constants/pagination";

import {
  useBooleanFilterOperators,
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Link } from "@/i18n/navigation";

import {
  Add,
  CardGiftcard,
  Delete,
  Edit,
  ManageSearch,
} from "@mui/icons-material";
import {
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
  Coupon,
  CouponFilterField,
  CouponSortField,
} from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization, OrganizationResponse } from "@/types/organizations";

import { getCouponsPath } from "@/utils/coupons";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getCouponEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const ChipsStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(0.5),
  height: "100%",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

interface CouponsProps {
  canGrantCoupon: boolean;
  canManageCoupon: boolean;
  canViewAuditLog: boolean;
  filterField?: CouponFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization?: Organization;
  organizations: OrganizationResponse[];
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: Coupon[];
  sortBy?: CouponSortField;
  sortDirection?: SortDirection;
}

const isExclusiveTo = (
  { applicableOrganizationIds }: Coupon,
  organizationId?: string,
) =>
  !!organizationId &&
  applicableOrganizationIds?.length === 1 &&
  applicableOrganizationIds[0] === organizationId;

const Coupons = ({
  canGrantCoupon,
  canManageCoupon,
  canViewAuditLog,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization,
  organizations: initialOrganizations,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: CouponsProps) => {
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

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const tAuth = useTranslations("auth");
  const tCoupons = useTranslations("coupons");

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const booleanFilterOperators = useBooleanFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const updateQuery = useUpdateQuery();

  const { data: organizations = initialOrganizations } = useSWR<
    OrganizationResponse[]
  >(canManageCoupon ? "/api/organizations" : null, fetcher, {
    fallbackData: initialOrganizations,
  });

  const enumOptions = useMemo(
    () => getCouponEnumOptions(tCoupons, organizations),
    [organizations, tCoupons],
  );

  const couponsPath =
    canManageCoupon || organization ? getCouponsPath(organization?.slug) : null;

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
  } = useSWR(
    couponsPath
      ? [
          couponsPath,
          filterModel.items[0]?.field,
          filterModel.items[0]?.operator,
          filterModel.items[0]?.value,
          filterModel.quickFilterValues,
          paginationModel.page,
          paginationModel.pageSize,
          sortModel,
        ]
      : null,
    async () => {
      const params = getDataGridSearchParams(
        paginationModel,
        filterModel,
        sortModel,
        enumOptions,
      );
      params.set("lang", locale);

      return fetcher<{ data: Coupon[]; total: number }>(
        `${couponsPath}?${params}`,
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

  const handleCreateCoupon = useCallback(() => {
    setDialog({
      content: (
        <CouponDialog
          coupon={null}
          mutate={mutate}
          organizations={organizations}
        />
      ),
      formId: "coupon-form",
      open: true,
      title: tCoupons("actions.createCoupon.title"),
    });
  }, [mutate, organizations, setDialog, tCoupons]);

  const handleUpdateCoupon = useCallback(
    (coupon: Coupon) => {
      setDialog({
        content: (
          <CouponDialog
            coupon={coupon}
            mutate={mutate}
            organizations={organizations}
          />
        ),
        formId: "coupon-form",
        open: true,
        title: tCoupons("actions.updateCoupon.title"),
      });
    },
    [mutate, organizations, setDialog, tCoupons],
  );

  const handleGrantCoupon = useCallback(
    (coupon: Coupon) => {
      setDialog({
        content: (
          <GrantCouponDialog
            coupon={coupon}
            organizationSlug={organization?.slug}
          />
        ),
        formId: "grant-coupon-form",
        open: true,
        title: tCoupons("actions.grantCoupon.title"),
      });
    },
    [organization?.slug, setDialog, tCoupons],
  );

  const handleDeleteCoupon = useCallback(
    ({ code, id }: Coupon) => {
      setDialog({
        content: (
          <DialogContentText>
            {tCoupons.rich("actions.deleteCoupon.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              code,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/coupons/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tCoupons("actions.deleteCoupon.success", { code }),
              { variant: "success" },
            );

            mutate();
          } catch {
            enqueueSnackbar(tCoupons("actions.deleteCoupon.error", { code }), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tCoupons("actions.deleteCoupon.title"),
      });
    },
    [mutate, setDialog, tCoupons],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canManageCoupon || canGrantCoupon || canViewAuditLog
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tCoupons("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<Coupon>) => (
                <ActionsStack direction="row">
                  {canManageCoupon && (
                    <Tooltip title={tCoupons("actions.updateCoupon.title")}>
                      <IconButton
                        onClick={() => handleUpdateCoupon(row)}
                        size="small"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canGrantCoupon && (
                    <Tooltip title={tCoupons("actions.grantCoupon.title")}>
                      <StyledIconButton
                        onClick={() => handleGrantCoupon(row)}
                        size="small"
                        visible={
                          canManageCoupon ||
                          isExclusiveTo(row, organization?.id)
                        }
                      >
                        <CardGiftcard fontSize="small" />
                      </StyledIconButton>
                    </Tooltip>
                  )}
                  {canManageCoupon && (
                    <Tooltip title={tCoupons("recipients.label")}>
                      <IconButton
                        component={Link}
                        href={getHref(
                          `/coupons/${row.id}`,
                          DEFAULT_PAGINATION_QUERY,
                        )}
                        size="small"
                      >
                        <ManageSearch fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  {canManageCoupon && (
                    <Tooltip title={tCoupons("actions.deleteCoupon.title")}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteCoupon(row)}
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
        field: "code",
        filterOperators: stringFilterOperators,
        headerName: tCoupons("code.label"),
      },
      {
        field: "scope",
        filterOperators: enumFilterOperators,
        headerName: tCoupons("scope.label"),
        type: "singleSelect",
        valueOptions: enumOptions.scope,
      },
      canManageCoupon
        ? {
            field: "applicableOrganizationIds",
            filterOperators: enumFilterOperators,
            headerName: tCoupons("organizationScope.label"),
            renderCell: ({
              row: { applicableOrganizationIds },
            }: GridRenderCellParams<Coupon>) => (
              <ChipsStack direction="row">
                {applicableOrganizationIds?.length ? (
                  organizations
                    .filter(({ id }) => applicableOrganizationIds.includes(id))
                    .map(({ id, name }) => (
                      <Chip
                        key={id}
                        label={name}
                        size="small"
                        variant="outlined"
                      />
                    ))
                ) : (
                  <Chip
                    label={tCoupons("organizationScope.all")}
                    size="small"
                    variant="outlined"
                  />
                )}
              </ChipsStack>
            ),
            type: "singleSelect",
            valueOptions: enumOptions.applicableOrganizationIds,
          }
        : {
            field: "applicableOrganizationIds",
            filterable: false,
            headerName: tCoupons("organizationScope.label"),
            renderCell: ({ row }: GridRenderCellParams<Coupon>) => (
              <ChipsStack direction="row">
                <Chip
                  label={tCoupons(
                    !row.applicableOrganizationIds?.length
                      ? "organizationScope.all"
                      : isExclusiveTo(row, organization?.id)
                        ? "organizationScope.exclusive"
                        : "organizationScope.shared",
                  )}
                  size="small"
                  variant="outlined"
                />
              </ChipsStack>
            ),
          },
      {
        field: "menuSectionIds",
        filterable: false,
        headerName: tCoupons("menuSectionIds.label"),
        renderCell: ({
          row: { menuSectionNames },
        }: GridRenderCellParams<Coupon>) =>
          menuSectionNames?.length ? (
            <ChipsStack direction="row">
              {menuSectionNames.map((name) => (
                <Chip key={name} label={name} size="small" variant="outlined" />
              ))}
            </ChipsStack>
          ) : null,
      },
      {
        field: "menuItemIds",
        filterable: false,
        headerName: tCoupons("menuItemIds.label"),
        renderCell: ({
          row: { menuItemNames },
        }: GridRenderCellParams<Coupon>) =>
          menuItemNames?.length ? (
            <ChipsStack direction="row">
              {menuItemNames.map((name) => (
                <Chip key={name} label={name} size="small" variant="outlined" />
              ))}
            </ChipsStack>
          ) : null,
      },
      {
        field: "discountValue",
        filterOperators: numberFilterOperators,
        headerName: tCoupons("discount"),
        valueGetter: (_value: unknown, coupon: Coupon) =>
          coupon.discountType === "percentage"
            ? `${format.number(Number(coupon.discountValue))}%`
            : formatMoney(
                Number(coupon.discountValue),
                coupon.discountCurrency,
              ),
      },
      {
        field: "minSubtotal",
        filterOperators: numberFilterOperators,
        headerName: tCoupons("minSubtotal.label"),
        renderCell: renderEmptyableCell,
        valueGetter: (
          _value: unknown,
          { discountCurrency, minSubtotal }: Coupon,
        ) =>
          minSubtotal == null
            ? ""
            : formatMoney(Number(minSubtotal), discountCurrency),
      },
      {
        field: "usedCount",
        filterOperators: numberFilterOperators,
        headerName: tCoupons("usage"),
        valueGetter: (_value: unknown, { totalLimit, usedCount }: Coupon) =>
          `${format.number(usedCount)} / ${
            totalLimit == null
              ? tCoupons("unlimited")
              : format.number(totalLimit)
          }`,
      },
      {
        field: "perUserLimit",
        filterOperators: numberFilterOperators,
        headerName: tCoupons("perUserLimit.label"),
        valueGetter: (_value: unknown, { perUserLimit }: Coupon) =>
          perUserLimit ?? tCoupons("unlimited"),
      },
      {
        field: "pointsCost",
        filterOperators: numberFilterOperators,
        headerName: tCoupons("pointsCost.label"),
        renderCell: renderEmptyableCell,
        valueGetter: (_value: unknown, { pointsCost }: Coupon) =>
          pointsCost == null
            ? ""
            : tAuth("points.points", { points: format.number(pointsCost) }),
      },
      {
        field: "validFrom",
        filterOperators: dateFilterOperators,
        headerName: tCoupons("validity"),
        valueGetter: (_value: unknown, { validFrom, validThrough }: Coupon) =>
          validFrom || validThrough
            ? [
                validFrom ? format.dateTime(new Date(validFrom), "short") : "",
                validThrough
                  ? format.dateTime(new Date(validThrough), "short")
                  : "",
              ].join(" ~ ")
            : tCoupons("unlimited"),
      },
      {
        field: "distribution",
        filterOperators: enumFilterOperators,
        headerName: tCoupons("distribution"),
        renderCell: ({ row }: GridRenderCellParams<Coupon>) => (
          <ChipsStack direction="row">
            {row.isPublic && (
              <Chip
                label={tCoupons("isPublic.label")}
                size="small"
                variant="outlined"
              />
            )}
            {row.isClaimable && (
              <Chip
                label={tCoupons("isClaimable.label")}
                size="small"
                variant="outlined"
              />
            )}
            {row.issueTrigger && (
              <Chip
                color="info"
                label={tCoupons(`issueTrigger.${row.issueTrigger}`)}
                size="small"
                variant="outlined"
              />
            )}
          </ChipsStack>
        ),
        type: "singleSelect",
        valueOptions: enumOptions.distribution,
      },
      {
        field: "isActive",
        filterOperators: booleanFilterOperators,
        headerName: tCoupons("isActive.label"),
        renderCell: ({ row: { isActive } }: GridRenderCellParams<Coupon>) => (
          <Chip
            color={isActive ? "success" : "default"}
            label={tCoupons(isActive ? "isActive.active" : "isActive.inactive")}
            size="small"
            variant="outlined"
          />
        ),
        type: "boolean",
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tCoupons("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      booleanFilterOperators,
      canGrantCoupon,
      canManageCoupon,
      canViewAuditLog,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      formatMoney,
      handleDeleteCoupon,
      handleGrantCoupon,
      handleUpdateCoupon,
      numberFilterOperators,
      organization?.id,
      organizations,
      stringFilterOperators,
      tAuth,
      tCoupons,
    ],
  );

  return (
    <>
      {canManageCoupon && (
        <ToolbarStack direction="row">
          <Button
            onClick={handleCreateCoupon}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tCoupons("actions.createCoupon.title")}
          </Button>
        </ToolbarStack>
      )}
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
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default Coupons;
