"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CreateOfferDialog from "../CreateOfferDialog";
import UpdateOfferDialog from "../UpdateOfferDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, Delete, Edit } from "@mui/icons-material";
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

import type { Offer } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MenuItemOffersProps {
  canWrite: boolean;
  menuItemId: string;
  offers: Offer[];
}

const MenuItemOffers = ({
  canWrite,
  menuItemId,
  offers: initialOffers,
}: MenuItemOffersProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const tMenus = useTranslations("menus");

  const apiRef = useGridApiRef();

  const { data: offers = initialOffers, mutate: mutateOffers } = useSWR(
    `/api/menu-items/${menuItemId}/offers`,
    () => fetcher<Offer[]>(`/api/menu-items/${menuItemId}/offers`),
    {
      fallbackData: initialOffers,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handleCreateOffer = useCallback(() => {
    setDialog({
      content: (
        <CreateOfferDialog
          menuItemId={menuItemId}
          mutateOffers={mutateOffers}
        />
      ),
      formId: "create-offer-form",
      open: true,
      title: tMenus("offers.actions.createOffer.title"),
    });
  }, [menuItemId, mutateOffers, setDialog, tMenus]);

  const handleUpdateOffer = useCallback(
    (offer: Offer) => {
      setDialog({
        content: (
          <UpdateOfferDialog offer={offer} mutateOffers={mutateOffers} />
        ),
        formId: "update-offer-form",
        open: true,
        title: tMenus("offers.actions.updateOffer.title"),
      });
    },
    [mutateOffers, setDialog, tMenus],
  );

  const handleDeleteOffer = useCallback(
    ({ id }: Offer) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMenus("offers.actions.deleteOffer.confirm")}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/offers/${id}`, { method: "DELETE" });

            enqueueSnackbar(tMenus("offers.actions.deleteOffer.success"), {
              variant: "success",
            });

            mutateOffers();
          } catch {
            enqueueSnackbar(tMenus("offers.actions.deleteOffer.error"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tMenus("offers.actions.deleteOffer.title"),
      });
    },
    [mutateOffers, setDialog, tMenus],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite
        ? [
            {
              disableColumnMenu: true,
              field: "actions",
              filterable: false,
              headerName: tMenus("offers.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<Offer>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  <Tooltip title={tMenus("offers.actions.updateOffer.title")}>
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        handleUpdateOffer(row);
                      }}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={tMenus("offers.actions.deleteOffer.title")}>
                    <IconButton
                      color="error"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteOffer(row);
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
          ]
        : []),
      { field: "name", headerName: tMenus("offers.name.label") },
      { field: "price", headerName: tMenus("offers.price.label") },
      {
        field: "priceCurrency",
        headerName: tMenus("offers.priceCurrency.label"),
      },
      {
        field: "availability",
        headerName: tMenus("offers.availability.label"),
        valueFormatter: (value: string | null) =>
          value
            ? tMenus(
                `offers.availability.options.${value}` as Parameters<
                  typeof tMenus
                >[0],
              )
            : "",
      },
      { field: "sku", headerName: tMenus("offers.sku.label") },
      {
        field: "validFrom",
        headerName: tMenus("offers.validFrom.label"),
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
      {
        field: "validThrough",
        headerName: tMenus("offers.validThrough.label"),
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
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
    [canWrite, format, handleDeleteOffer, handleUpdateOffer, tMenus],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        {canWrite && (
          <Button
            onClick={handleCreateOffer}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tMenus("offers.actions.createOffer.title")}
          </Button>
        )}
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        rows={offers}
        hideFooter
      />
    </>
  );
};

export default MenuItemOffers;
