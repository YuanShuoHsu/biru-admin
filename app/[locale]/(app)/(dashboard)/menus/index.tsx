"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateMenuDialog from "./CreateMenuDialog";
import UpdateMenuDialog from "./UpdateMenuDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { fetcher } from "@/utils/fetcher";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminMenu } from "@/types/menus";
import type { Organization } from "@/types/organizations";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const LOCALE_LABEL: Record<string, string> = {
  "zh-TW": "繁體中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  "zh-CN": "简体中文",
};

interface MenusProps {
  organizations: Organization[];
}

const Menus = ({ organizations }: MenusProps) => {
  const [selectedOrgId, setSelectedOrgId] = useState(
    organizations[0]?.id ?? "",
  );

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tMenus = useTranslations("menus");

  const {
    data: rows = [],
    isLoading,
    mutate,
  } = useSWR<AdminMenu[]>(
    selectedOrgId ? `/api/organizations/${selectedOrgId}/menus` : null,
    {
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const handleCreateMenu = () => {
    setDialog({
      content: (
        <CreateMenuDialog
          organizationId={selectedOrgId}
          onSuccess={mutate}
        />
      ),
      formId: "create-menu-form",
      open: true,
      title: tMenus("actions.createMenu.title"),
    });
  };

  const handleUpdateMenu = useCallback(
    (menu: AdminMenu) => {
      setDialog({
        content: <UpdateMenuDialog menu={menu} onSuccess={mutate} />,
        formId: "update-menu-form",
        open: true,
        title: tMenus("actions.updateMenu.title"),
      });
    },
    [mutate, setDialog, tMenus],
  );

  const handleDeleteMenu = useCallback(
    ({ id, name }: AdminMenu) => {
      setDialog({
        content: (
          <DialogContentText>
            {tMenus.rich("actions.deleteMenu.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`/api/menus/${id}`, { method: "DELETE" });

            enqueueSnackbar(tMenus("actions.deleteMenu.success", { name }), {
              variant: "success",
            });

            mutate();
          } catch {
            enqueueSnackbar(tMenus("actions.deleteMenu.title"), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tMenus("actions.deleteMenu.title"),
      });
    },
    [mutate, setDialog, tMenus],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tMenus("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<AdminMenu>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tMenus("actions.updateMenu.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();
                  handleUpdateMenu(row);
                }}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tMenus("actions.deleteMenu.title")}>
              <IconButton
                color="error"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteMenu(row);
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
      {
        field: "name",
        headerName: tMenus("name.label"),
        flex: 1,
      },
      {
        field: "inLanguage",
        headerName: tMenus("inLanguage.label"),
        renderCell: ({ value }: GridRenderCellParams<AdminMenu>) => (
          <Stack height="100%" justifyContent="center">
            <Chip
              label={LOCALE_LABEL[value] ?? value}
              size="small"
              variant="outlined"
            />
          </Stack>
        ),
        resizable: false,
        sortable: false,
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
    [format, handleDeleteMenu, handleUpdateMenu, tMenus],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{tMenus("organization.label")}</InputLabel>
          <Select
            label={tMenus("organization.label")}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            value={selectedOrgId}
          >
            {organizations.map(({ id, name }) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          disabled={!selectedOrgId}
          onClick={handleCreateMenu}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tMenus("actions.createMenu.title")}
        </Button>
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={isLoading}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default Menus;
