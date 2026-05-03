"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import CreateMenuDialog from "./CreateMenuDialog";
import UpdateMenuDialog from "./UpdateMenuDialog";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { locales } from "@/constants/locale";

import { useRouter } from "@/i18n/navigation";

import { Add, Delete, Edit, OpenInNew } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  MenuItem,
  Stack,
  styled,
  TextField,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminMenu } from "@/types/menus";
import type { Organization } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const OrganizationSelectBox = styled(Box)({
  width: 200,
});

interface MenusProps {
  organizations: Organization[];
  rows: AdminMenu[];
}

const Menus = ({ organizations, rows: initialRows }: MenusProps) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState(initialRows);

  const apiRef = useGridApiRef();

  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("organization");

  const selectedOrganization = organizations.find(
    ({ slug }) => slug === orgSlug,
  );
  const selectedOrganizationId = selectedOrganization?.id || "";

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const router = useRouter();

  const tMenus = useTranslations("menus");

  const fetchMenus = useCallback(() => {
    if (!selectedOrganizationId) return;

    const onRequest = () => setLoading(true);

    const onSuccess = (data: AdminMenu[]) => {
      flushSync(() => {
        setRows(data);
        setLoading(false);
      });

      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    };

    const onError = (error: unknown) => {
      setLoading(false);

      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    };

    onRequest();
    fetcher<AdminMenu[]>(`/api/organizations/${selectedOrganizationId}/menus`)
      .then(onSuccess)
      .catch(onError);
  }, [apiRef, selectedOrganizationId]);

  const handleCreateMenu = () => {
    setDialog({
      content: (
        <CreateMenuDialog
          organizationId={selectedOrganizationId}
          fetchMenus={fetchMenus}
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
        content: <UpdateMenuDialog menu={menu} fetchMenus={fetchMenus} />,
        formId: "update-menu-form",
        open: true,
        title: tMenus("actions.updateMenu.title"),
      });
    },
    [fetchMenus, setDialog, tMenus],
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

            fetchMenus();
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
    [fetchMenus, setDialog, tMenus],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tMenus("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<AdminMenu>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tMenus("actions.viewMenu.title")}>
              <IconButton
                onClick={() => router.push(`/menus/${row.id}`)}
                size="small"
              >
                <OpenInNew fontSize="small" />
              </IconButton>
            </Tooltip>
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
      },
      {
        field: "inLanguage",
        headerName: tMenus("inLanguage.label"),
        renderCell: ({
          row: { inLanguage },
        }: GridRenderCellParams<AdminMenu>) =>
          inLanguage && (
            <Chip
              label={locales[inLanguage].label}
              size="small"
              variant="outlined"
            />
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
    [format, handleDeleteMenu, handleUpdateMenu, router, tMenus],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        <OrganizationSelectBox>
          <TextField
            fullWidth
            label={tMenus("organization.label")}
            onChange={(event) =>
              router.replace(`/menus?organization=${event.target.value}`)
            }
            select
            slotProps={{
              select: { displayEmpty: true },
            }}
            size="small"
            value={selectedOrganization?.slug || ""}
          >
            <MenuItem disabled value="">
              {tMenus("organization.placeholder")}
            </MenuItem>
            {organizations.map(({ id, slug, name }) => (
              <MenuItem key={id} value={slug}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        </OrganizationSelectBox>
        <Button
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
        loading={loading}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default Menus;
