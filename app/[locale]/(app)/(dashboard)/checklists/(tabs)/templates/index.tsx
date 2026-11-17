"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import ChecklistTemplateDialog from "./ChecklistTemplateDialog";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Add, Delete, Edit } from "@mui/icons-material";
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

import type { ChecklistTemplate } from "@/types/checklists";

import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface ChecklistTemplatesProps {
  closed: boolean;
  organizationSlug: string;
}

const ChecklistTemplates = ({
  closed,
  organizationSlug,
}: ChecklistTemplatesProps) => {
  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tChecklists = useTranslations("checklists.templates");

  const templatesUrl = `/api/organizations/${organizationSlug}/checklists/templates`;

  const {
    data: rows = [],
    isValidating,
    mutate,
  } = useSWR<ChecklistTemplate[]>(templatesUrl, {
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

  const handleTemplateDialog = useCallback(
    (template?: ChecklistTemplate) =>
      setDialog({
        content: (
          <ChecklistTemplateDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            template={template}
          />
        ),
        formId: "checklist-template-form",
        open: true,
        title: tChecklists(
          template ? "actions.update.title" : "actions.create.title",
        ),
      }),
    [mutate, organizationSlug, setDialog, tChecklists],
  );

  const handleRemove = useCallback(
    ({ id, name }: ChecklistTemplate) =>
      setDialog({
        content: (
          <DialogContentText>
            {tChecklists.rich("actions.remove.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`${templatesUrl}/${id}`, { method: "DELETE" });

            enqueueSnackbar(tChecklists("actions.remove.success"), {
              variant: "success",
            });
          } finally {
            await mutate();
          }
        },
        open: true,
        title: tChecklists("actions.remove.title"),
      }),
    [mutate, setDialog, tChecklists, templatesUrl],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tChecklists("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<ChecklistTemplate>) => (
          <ActionsStack direction="row">
            <Tooltip title={tChecklists("actions.update.title")}>
              <span>
                <IconButton
                  aria-label={tChecklists("actions.update.title")}
                  disabled={closed}
                  onClick={() => handleTemplateDialog(row)}
                  size="small"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={tChecklists("actions.remove.title")}>
              <span>
                <IconButton
                  aria-label={tChecklists("actions.remove.title")}
                  color="error"
                  disabled={closed}
                  onClick={() => handleRemove(row)}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </ActionsStack>
        ),
        resizable: false,
        sortable: false,
      },
      { field: "name", headerName: tChecklists("name") },
      {
        field: "timing",
        headerName: tChecklists("timing.label"),
        valueFormatter: (value: ChecklistTemplate["timing"]) =>
          tChecklists(`timing.${value}`),
      },
      { field: "enabled", headerName: tChecklists("enabled"), type: "boolean" },
      {
        field: "items",
        headerName: tChecklists("items.label"),
        valueGetter: (value: ChecklistTemplate["items"]) =>
          value.map(({ label }) => label).join(tCommon("delimiter")),
      },
    ],
    [closed, handleRemove, handleTemplateDialog, tChecklists, tCommon],
  );

  return (
    <>
      <ToolbarStack direction="row">
        <Button
          disabled={closed}
          onClick={() => handleTemplateDialog()}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tChecklists("actions.create.title")}
        </Button>
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={isValidating}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default ChecklistTemplates;
