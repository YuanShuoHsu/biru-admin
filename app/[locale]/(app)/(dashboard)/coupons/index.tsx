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
import type { OrderMenu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface CouponsProps {
  canWrite: boolean;
  coupons: Coupon[];
  menu: OrderMenu | null;
  organizationSlug: string;
}

const Coupons = ({
  canWrite,
  coupons: initialCoupons,
  menu,
  organizationSlug,
}: CouponsProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tCoupons = useTranslations("coupons");

  const { data: coupons = initialCoupons, mutate } = useSWR<Coupon[]>(
    `/api/organizations/${organizationSlug}/coupons`,
    { fallbackData: initialCoupons },
  );

  const handleCreateCoupon = useCallback(() => {
    setDialog({
      content: (
        <CouponDialog
          coupon={null}
          menu={menu}
          mutate={mutate}
          organizationSlug={organizationSlug}
        />
      ),
      formId: "coupon-form",
      open: true,
      title: tCoupons("actions.createCoupon.title"),
    });
  }, [menu, mutate, organizationSlug, setDialog, tCoupons]);

  const handleUpdateCoupon = useCallback(
    (coupon: Coupon) => {
      setDialog({
        content: (
          <CouponDialog
            coupon={coupon}
            menu={menu}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "coupon-form",
        open: true,
        title: tCoupons("actions.updateCoupon.title"),
      });
    },
    [menu, mutate, organizationSlug, setDialog, tCoupons],
  );

  const handleGrantCoupon = useCallback(
    (coupon: Coupon) => {
      setDialog({
        content: (
          <GrantCouponDialog
            coupon={coupon}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "grant-coupon-form",
        open: true,
        title: tCoupons("actions.grantCoupon.title"),
      });
    },
    [organizationSlug, setDialog, tCoupons],
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
            await fetcher(
              `/api/organizations/${organizationSlug}/coupons/${id}`,
              { method: "DELETE" },
            );

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
    [mutate, organizationSlug, setDialog, tCoupons],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite
        ? [
            {
              disableColumnMenu: true,
              field: "actions",
              filterable: false,
              headerName: tCoupons("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<Coupon>) => (
                <Stack
                  alignItems="center"
                  direction="row"
                  gap={1}
                  height="100%"
                >
                  <Tooltip title={tCoupons("actions.updateCoupon.title")}>
                    <IconButton
                      onClick={() => handleUpdateCoupon(row)}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={tCoupons("actions.grantCoupon.title")}>
                    <IconButton
                      onClick={() => handleGrantCoupon(row)}
                      size="small"
                    >
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
          ]
        : []),
      {
        field: "code",
        headerName: tCoupons("code.label"),
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
        field: "scope",
        headerName: tCoupons("scope.label"),
        valueGetter: (_value: unknown, { scope }: Coupon) =>
          tCoupons(`scope.${scope}`),
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
        width: 180,
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
      canWrite,
      format,
      handleDeleteCoupon,
      handleGrantCoupon,
      handleUpdateCoupon,
      tCoupons,
    ],
  );

  return (
    <>
      {canWrite && (
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
      <DataGrid {...DATA_GRID_PROPS} columns={columns} rows={coupons} />
    </>
  );
};

export default Coupons;
