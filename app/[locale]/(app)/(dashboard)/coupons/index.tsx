"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CouponDialog from "./CouponDialog";
import GrantCouponDialog from "./GrantCouponDialog";

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

import { Link, usePathname, useRouter } from "@/i18n/navigation";

import { Add, CardGiftcard, Delete, Edit, History } from "@mui/icons-material";
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

import { couponIssueTriggerValues, couponScopeValues } from "@/types/api";
import type {
  Coupon,
  CouponFilterField,
  CouponSortField,
} from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization, OrganizationResponse } from "@/types/organizations";

import { getCouponsPath } from "@/utils/coupons";
import {
  getDataGridSearchParams,
  getFilterItemParams,
  getQuickFilterEnums,
} from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";
import { getHref } from "@/utils/href";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

interface CouponsProps {
  canGrantCoupon: boolean;
  canManageCoupon: boolean;
  coupons: Coupon[];
  filterField?: CouponFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization?: Organization;
  organizations: OrganizationResponse[];
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
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
  coupons: initialCoupons,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization,
  organizations: initialOrganizations,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
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

  const apiRef = useGridApiRef();

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const searchParams = useSearchParams();

  const tCoupons = useTranslations("coupons");

  const stringFilterOperators = useStringFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const booleanFilterOperators = useBooleanFilterOperators();
  const dateFilterOperators = useDateFilterOperators();

  const { data: organizations = initialOrganizations } = useSWR<
    OrganizationResponse[]
  >(canManageCoupon ? "/api/organizations" : null, fetcher, {
    fallbackData: initialOrganizations,
  });

  const enumOptions = useMemo(
    () => ({
      applicableOrganizationIds: [
        { label: tCoupons("organizationScope.all"), value: "all" },
        ...organizations.map(({ id, name }) => ({ label: name, value: id })),
      ],
      distribution: [
        { label: tCoupons("isPublic.label"), value: "isPublic" },
        { label: tCoupons("isClaimable.label"), value: "isClaimable" },
        ...couponIssueTriggerValues.map((value) => ({
          label: tCoupons(`issueTrigger.${value}`),
          value,
        })),
      ],
      isActive: [
        { label: tCoupons("isActive.active"), value: "true" },
        { label: tCoupons("isActive.inactive"), value: "false" },
      ],
      scope: couponScopeValues.map((value) => ({
        label: tCoupons(`scope.${value}`),
        value,
      })),
    }),
    [organizations, tCoupons],
  );

  const couponsPath =
    canManageCoupon || organization ? getCouponsPath(organization?.slug) : null;

  const {
    data: { data: coupons, total: rowCount } = {
      data: initialCoupons,
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
      fallbackData: { data: initialCoupons, total: initialRowCount },
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

      const params = new URLSearchParams({
        ...Object.fromEntries(searchParams),
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));

      const sortItem = newModel[0];
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortBy: _sortBy,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sortDirection: _sortDirection,
        ...rest
      } = Object.fromEntries(searchParams);
      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...(sortItem?.field && { sortBy: sortItem.field }),
        ...(sortItem?.sort && { sortDirection: sortItem.sort }),
      });

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
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterField: _filterField,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterOperator: _filterOperator,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filterValue: _filterValue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        quickFilterValue: _quickFilterValue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        quickFilterEnums: _quickFilterEnums,
        ...rest
      } = Object.fromEntries(searchParams);

      const params = new URLSearchParams({
        ...rest,
        page: "1",
        ...getFilterItemParams(filterItem),
        ...(newQuickFilterValue && { quickFilterValue: newQuickFilterValue }),
      });
      if (newQuickFilterValue)
        for (const entry of getQuickFilterEnums(
          newQuickFilterValue,
          enumOptions,
        ))
          params.append("quickFilterEnums", entry);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [enumOptions, pathname, router, searchParams],
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
      {
        disableColumnMenu: true,
        field: "actions",
        filterable: false,
        headerName: tCoupons("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Coupon>) => (
          <Stack alignItems="center" direction="row" gap={1} height="100%">
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
                    canManageCoupon || isExclusiveTo(row, organization?.id)
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
                  href={getHref(`/coupons/${row.id}`, DEFAULT_PAGINATION_QUERY)}
                  size="small"
                >
                  <History fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
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
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
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
              <Stack
                alignItems="center"
                direction="row"
                gap={0.5}
                height="100%"
              >
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
              </Stack>
            ),
            type: "singleSelect",
            valueOptions: enumOptions.applicableOrganizationIds,
          }
        : {
            field: "applicableOrganizationIds",
            filterable: false,
            headerName: tCoupons("organizationScope.label"),
            renderCell: ({ row }: GridRenderCellParams<Coupon>) => (
              <Stack
                alignItems="center"
                direction="row"
                gap={0.5}
                height="100%"
              >
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
              </Stack>
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
            <Stack alignItems="center" direction="row" gap={0.5} height="100%">
              {menuSectionNames.map((name) => (
                <Chip key={name} label={name} size="small" variant="outlined" />
              ))}
            </Stack>
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
            <Stack alignItems="center" direction="row" gap={0.5} height="100%">
              {menuItemNames.map((name) => (
                <Chip key={name} label={name} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : null,
      },
      {
        field: "discountValue",
        filterOperators: numberFilterOperators,
        headerName: tCoupons("discount"),
        valueGetter: (_value: unknown, coupon: Coupon) =>
          coupon.discountType === "percentage"
            ? `${Number(coupon.discountValue)}%`
            : `${coupon.discountCurrency} ${Number(coupon.discountValue)}`,
      },
      {
        field: "minSubtotal",
        filterOperators: numberFilterOperators,
        headerName: tCoupons("minSubtotal.label"),
        valueGetter: (_value: unknown, { minSubtotal }: Coupon) =>
          minSubtotal ? Number(minSubtotal) : "",
      },
      {
        field: "usedCount",
        filterOperators: numberFilterOperators,
        headerName: tCoupons("usage"),
        valueGetter: (_value: unknown, { totalLimit, usedCount }: Coupon) =>
          `${usedCount} / ${totalLimit ?? tCoupons("unlimited")}`,
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
        valueGetter: (_value: unknown, { pointsCost }: Coupon) =>
          pointsCost || "",
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
          <Stack alignItems="center" direction="row" gap={0.5} height="100%">
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
          </Stack>
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
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      handleDeleteCoupon,
      handleGrantCoupon,
      handleUpdateCoupon,
      numberFilterOperators,
      organization?.id,
      organizations,
      stringFilterOperators,
      tCoupons,
    ],
  );

  return (
    <>
      {canManageCoupon && (
        <Stack alignItems="center" direction="row" flexWrap="wrap" gap={2}>
          <Button
            onClick={handleCreateCoupon}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tCoupons("actions.createCoupon.title")}
          </Button>
        </Stack>
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
        rows={coupons}
        sortingMode="server"
        sortModel={sortModel}
      />
    </>
  );
};

export default Coupons;
