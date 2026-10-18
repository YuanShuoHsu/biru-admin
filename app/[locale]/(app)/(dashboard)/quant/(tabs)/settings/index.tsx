"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";

import {
  QUANT_CREDENTIALS_URL,
  useQuantCredentials,
} from "../useQuantCredentials";
import AiKeySettings from "./AiKeySettings";
import CredentialDialog, { CREDENTIAL_FORM_ID } from "./CredentialDialog";

import DataGrid from "@/components/DataGrid";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, LinkOff } from "@mui/icons-material";
import {
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

const TIME_COLUMN_MIN_WIDTH = 180;

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
    { field: "label", headerName: tQuant("settings.columns.label") },
    {
      field: "apiKeyLast4",
      headerName: tQuant("settings.columns.apiKey"),
      valueFormatter: (value: string) => `••••${value}`,
    },
    {
      field: "createdAt",
      headerName: tQuant("settings.columns.createdAt"),
      minWidth: TIME_COLUMN_MIN_WIDTH,
      valueFormatter: (value: string) =>
        format.dateTime(new Date(value), "dateTime"),
    },
  ];

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack
        sx={{
          alignItems: "center",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Button
          onClick={handleAdd}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tQuant("settings.add.label")}
        </Button>
        <AiKeySettings />
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        loading={!credentials}
        rows={credentials ?? []}
        showToolbar={false}
      />
    </Stack>
  );
};

export default CredentialSettings;
