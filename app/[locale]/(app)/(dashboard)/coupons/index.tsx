"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CouponDialog from "./CouponDialog";
import GrantCouponDialog from "./GrantCouponDialog";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, CardGiftcard, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Coupon } from "@/types/coupons";
import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface CouponsProps {
  coupons: Coupon[];
  organizations: OrganizationResponse[];
}

const Coupons = ({ coupons: initialCoupons, organizations }: CouponsProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tCoupons = useTranslations("coupons");

  const { data: coupons = initialCoupons, mutate } = useSWR<Coupon[]>(
    "/api/coupons",
    { fallbackData: initialCoupons },
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
        content: <GrantCouponDialog coupon={coupon} />,
        formId: "grant-coupon-form",
        open: true,
        title: tCoupons("actions.grantCoupon.title"),
      });
    },
    [setDialog, tCoupons],
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
            <Tooltip title={tCoupons("actions.updateCoupon.title")}>
              <IconButton onClick={() => handleUpdateCoupon(row)} size="small">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tCoupons("actions.grantCoupon.title")}>
              <IconButton onClick={() => handleGrantCoupon(row)} size="small">
                <CardGiftcard fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tCoupons("actions.deleteCoupon.title")}>
              <IconButton
                color="error"
                onClick={() => handleDeleteCoupon(row)}
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
        field: "code",
        headerName: tCoupons("code.label"),
      },
      {
        field: "applicableOrganizationIds",
        headerName: tCoupons("organizationScope.label"),
        valueGetter: (
          _value: unknown,
          { applicableOrganizationIds }: Coupon,
        ) =>
          applicableOrganizationIds?.length
            ? applicableOrganizationIds
                .map(
                  (id) =>
                    organizations.find((org) => org.id === id)?.name || id,
                )
                .join(", ")
            : tCoupons("organizationScope.all"),
      },
      {
        field: "scope",
        headerName: tCoupons("scope.label"),
        valueGetter: (_value: unknown, { scope }: Coupon) =>
          tCoupons(`scope.${scope}`),
      },
      {
        field: "discountValue",
        headerName: tCoupons("discount"),
        valueGetter: (_value: unknown, coupon: Coupon) =>
          coupon.discountType === "percentage"
            ? `${Number(coupon.discountValue)}%`
            : `${coupon.discountCurrency} ${Number(coupon.discountValue)}`,
      },
      {
        field: "minSubtotal",
        headerName: tCoupons("minSubtotal.label"),
        valueGetter: (_value: unknown, { minSubtotal }: Coupon) =>
          minSubtotal ? Number(minSubtotal) : "",
      },
      {
        field: "usedCount",
        headerName: tCoupons("usage"),
        valueGetter: (_value: unknown, { totalLimit, usedCount }: Coupon) =>
          `${usedCount} / ${totalLimit ?? tCoupons("unlimited")}`,
      },
      {
        field: "perUserLimit",
        headerName: tCoupons("perUserLimit.label"),
        valueGetter: (_value: unknown, { perUserLimit }: Coupon) =>
          perUserLimit ?? tCoupons("unlimited"),
      },
      {
        field: "pointsCost",
        headerName: tCoupons("pointsCost.label"),
        valueGetter: (_value: unknown, { pointsCost }: Coupon) =>
          pointsCost || "",
      },
      {
        field: "validFrom",
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
        field: "isPublic",
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
        sortable: false,
      },
      {
        field: "isActive",
        headerName: tCoupons("isActive.label"),
        renderCell: ({ row: { isActive } }: GridRenderCellParams<Coupon>) => (
          <Chip
            color={isActive ? "success" : "default"}
            label={tCoupons(isActive ? "isActive.active" : "isActive.inactive")}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "createdAt",
        headerName: tCoupons("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      format,
      handleDeleteCoupon,
      handleGrantCoupon,
      handleUpdateCoupon,
      organizations,
      tCoupons,
    ],
  );

  return (
    <>
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
      <DataGrid {...DATA_GRID_PROPS} columns={columns} rows={coupons} />
    </>
  );
};

export default Coupons;
