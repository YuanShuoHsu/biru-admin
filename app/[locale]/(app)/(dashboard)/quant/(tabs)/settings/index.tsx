"use client";

import { useCallback, useMemo } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";

import {
  QUANT_CREDENTIALS_URL,
  useQuantCredentials,
} from "../useQuantCredentials";
import AiKeySettings from "./AiKeySettings";
import CredentialDialog, { CREDENTIAL_FORM_ID } from "./CredentialDialog";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, LinkOff } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { QuantCredential } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const CredentialSettings = () => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const setDialog = useDialogStore((state) => state.setDialog);

  const apiRef = useGridApiRef();

  const { credentials, mutate, selectCredential } = useQuantCredentials({
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

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

  const handleDelete = useCallback(
    ({ id, label }: QuantCredential) =>
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
      }),
    [mutate, setDialog, tQuant],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tQuant("settings.columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<QuantCredential>) => (
          <Tooltip title={tQuant("settings.delete.label")}>
            <IconButton
              color="error"
              onClick={(event) => {
                event.stopPropagation();

                handleDelete(row);
              }}
              size="small"
            >
              <LinkOff fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
        resizable: false,
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
        type: "date",
        valueFormatter: (value: Date) => format.dateTime(value, "short"),
        valueGetter: (value: string) => new Date(value),
      },
    ],
    [format, handleDelete, tQuant],
  );

  return (
    <>
      <ToolbarStack direction="row">
        <Button
          onClick={handleAdd}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tQuant("settings.add.label")}
        </Button>
        <AiKeySettings />
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={!credentials}
        rows={credentials ?? []}
      />
    </>
  );
};

export default CredentialSettings;
