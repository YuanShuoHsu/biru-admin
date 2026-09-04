"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import OfferDialog from "./OfferDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Link,
  Stack,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Ingredient, IngredientOffer, Supplier } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface IngredientOffersProps {
  canWrite: boolean;
  ingredient: Ingredient;
  offers: IngredientOffer[];
  suppliers: Supplier[];
}

const IngredientOffers = ({
  canWrite,
  ingredient,
  offers: initialOffers,
  suppliers,
}: IngredientOffersProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const {
    data: offers = initialOffers,
    mutate,
    isValidating: loading,
  } = useSWR(
    `/api/ingredients/${ingredient.id}/offers`,
    async (url) => fetcher<IngredientOffer[]>(url),
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
        <OfferDialog
          ingredient={ingredient}
          mutate={mutate}
          offer={null}
          suppliers={suppliers}
        />
      ),
      formId: "ingredient-offer-form",
      open: true,
      title: tInventory("offers.actions.createOffer.title"),
    });
  }, [ingredient, mutate, setDialog, suppliers, tInventory]);

  const handleUpdateOffer = useCallback(
    (offer: IngredientOffer) => {
      setDialog({
        content: (
          <OfferDialog
            ingredient={ingredient}
            mutate={mutate}
            offer={offer}
            suppliers={suppliers}
          />
        ),
        formId: "ingredient-offer-form",
        open: true,
        title: tInventory("offers.actions.updateOffer.title"),
      });
    },
    [ingredient, mutate, setDialog, suppliers, tInventory],
  );

  const handleDeleteOffer = useCallback(
    ({ id }: IngredientOffer) => {
      setDialog({
        content: (
          <DialogContentText>
            {tInventory.rich("offers.actions.deleteOffer.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: localize(ingredient.name, locale),
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/ingredients/${ingredient.id}/offers/${id}`, {
              method: "DELETE",
            });

            enqueueSnackbar(tInventory("offers.actions.deleteOffer.success"), {
              variant: "success",
            });

            mutate();
          } catch {
            enqueueSnackbar(tInventory("offers.actions.deleteOffer.error"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tInventory("offers.actions.deleteOffer.title"),
      });
    },
    [ingredient.id, ingredient.name, locale, mutate, setDialog, tInventory],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite
        ? [
            {
              disableColumnMenu: true,
              field: "actions",
              filterable: false,
              headerName: tInventory("offers.actions.label"),
              renderCell: ({ row }: GridRenderCellParams<IngredientOffer>) => (
                <Stack
                  height="100%"
                  direction="row"
                  alignItems="center"
                  gap={1}
                >
                  <Tooltip
                    title={tInventory("offers.actions.updateOffer.title")}
                  >
                    <IconButton
                      onClick={() => handleUpdateOffer(row)}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    title={tInventory("offers.actions.deleteOffer.title")}
                  >
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteOffer(row)}
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
        field: "supplierName",
        headerName: `${tInventory("offers.supplierId.label")} ${tCommon("optional")}`,
      },
      {
        field: "price",
        headerName: tInventory("offers.price.label"),
        valueGetter: (_value: unknown, row: IngredientOffer) =>
          `${row.priceCurrency} ${format.number(Number(row.price))}`,
      },
      {
        field: "eligibleQuantity",
        headerName: tInventory("offers.eligibleQuantity.label"),
        valueGetter: (_value: unknown, row: IngredientOffer) =>
          `${format.number(Number(row.eligibleQuantity))} ${tInventory(`units.${row.eligibleQuantityUnitCode}`)}`,
      },
      {
        field: "unitPrice",
        headerName: tInventory("offers.unitPrice.label"),
        valueFormatter: (value: number) =>
          `${format.number(value, { maximumFractionDigits: 4 })} / ${tInventory(`units.${ingredient.unitCode}`)}`,
      },
      {
        field: "url",
        headerName: `${tInventory("offers.url.label")} ${tCommon("optional")}`,
        renderCell: ({ row: { url } }: GridRenderCellParams<IngredientOffer>) =>
          url && (
            <Link href={url} rel="noopener" target="_blank">
              {url}
            </Link>
          ),
      },
      {
        field: "sortOrder",
        headerName: tInventory("offers.sortOrder.label"),
      },
    ],
    [
      canWrite,
      format,
      handleDeleteOffer,
      handleUpdateOffer,
      ingredient.unitCode,
      tCommon,
      tInventory,
    ],
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
            {tInventory("offers.actions.createOffer.title")}
          </Button>
        )}
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={loading}
        rows={offers}
      />
    </>
  );
};

export default IngredientOffers;
