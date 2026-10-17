"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";

import {
  QUANT_CREDENTIALS_URL,
  useQuantCredentials,
} from "../useQuantCredentials";
import CredentialDialog, { CREDENTIAL_FORM_ID } from "./CredentialDialog";

import DataGrid from "@/components/DataGrid";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, LinkOff } from "@mui/icons-material";
import {
  Box,
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { QuantCredential } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const CredentialSettings = () => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const setDialog = useDialogStore((state) => state.setDialog);

  const { credentials, mutate, selectCredential } = useQuantCredentials();

  const handleAdd = () =>
    setDialog({
      content: (
        <CredentialDialog
          onCreated={({ id }) => {
            selectCredential(id);
            void mutate();
          }}
        />
      ),
      formId: CREDENTIAL_FORM_ID,
      open: true,
      title: tQuant("settings.add.label"),
    });

  const handleDelete = ({ id, label }: QuantCredential) =>
    setDialog({
      content: (
        <DialogContentText>
          {tQuant.rich("settings.delete.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            label,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`${QUANT_CREDENTIALS_URL}/${id}`, {
            method: "DELETE",
          });
          enqueueSnackbar(tQuant("settings.delete.success"), {
            variant: "success",
          });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          void mutate();
        }
      },
      open: true,
      title: tQuant("settings.delete.title"),
    });

  const columns: GridColDef[] = [
    { field: "label", headerName: tQuant("settings.columns.label") },
    {
      field: "apiKeyLast4",
      headerName: tQuant("settings.columns.apiKey"),
      valueFormatter: (value: string) => `••••${value}`,
    },
    {
      field: "createdAt",
      headerName: tQuant("settings.columns.createdAt"),
      valueFormatter: (value: string) =>
        format.dateTime(new Date(value), "dateTime"),
    },
    {
      field: "actions",
      filterable: false,
      headerName: tQuant("settings.columns.actions"),
      renderCell: ({ row }: GridRenderCellParams<QuantCredential>) => (
        <Tooltip title={tQuant("settings.delete.label")}>
          <IconButton
            color="error"
            onClick={() => handleDelete(row)}
            size="small"
          >
            <LinkOff fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
      sortable: false,
    },
  ];

  return (
    <Stack sx={{ gap: 2 }}>
      <Box>
        <Button onClick={handleAdd} startIcon={<Add />} variant="contained">
          {tQuant("settings.add.label")}
        </Button>
      </Box>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        loading={!credentials}
        localeText={{ noRowsLabel: tQuant("settings.empty") }}
        rows={credentials ?? []}
        showToolbar={false}
      />
    </Stack>
  );
};

export default CredentialSettings;
