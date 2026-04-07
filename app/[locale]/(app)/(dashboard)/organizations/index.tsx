// https://mui.com/x/react-data-grid/column-dimensions/#ColumnAutosizingAsync.tsx
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { flushSync } from "react-dom";

import CreateOrganizationDialogContent from "./CreateOrganizationDialogContent";
import UpdateOrganizationDialogContent from "./UpdateOrganizationDialogContent";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient, getErrorMessage } from "@/lib/auth-client";

import { AddBusiness, Delete, Edit, ManageAccounts } from "@mui/icons-material";
import {
  Avatar,
  Button,
  DialogContentText,
  IconButton,
  Stack,
  styled,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useAuthStore } from "@/providers/auth-store-provider";
import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/organizations";

import { stringAvatar } from "@/utils/avatar";
import {
  getOrganizationPermissions,
  type OrganizationPermissions,
} from "@/utils/organizations";

const StyledAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  fontSize: 12,
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface OrganizationsProps {
  organizationPermissions: OrganizationPermissions;
  rows: Organization[];
}

const Organizations = ({
  organizationPermissions: initialOrganizationPermissions,
  rows: initialRows,
}: OrganizationsProps) => {
  const [loading, setLoading] = useState(false);
  const [organizationPermissions, setOrganizationPermissions] = useState(
    initialOrganizationPermissions,
  );
  const [rows, setRows] = useState(initialRows);

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);
  const { setSession } = useAuthStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const router = useRouter();

  const tOrganizations = useTranslations("organizations");

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data } = await authClient.organization.list();
    if (!data?.length) {
      enqueueSnackbar(getErrorMessage("NO_ACTIVE_ORGANIZATION", locale), {
        variant: "error",
      });
      await authClient.signOut();
      setSession(null);
      setLoading(false);
      router.replace("/");

      return;
    }

    const permissions = await getOrganizationPermissions(data);
    setOrganizationPermissions(permissions);

    flushSync(() => {
      setRows(data.toReversed());

      setLoading(false);
    });

    setTimeout(() => {
      apiRef.current?.autosizeColumns(autosizeOptions);
    }, 0);
  }, [apiRef, locale, router, setSession]);

  const handleCreateOrganization = () => {
    setDialog({
      content: <CreateOrganizationDialogContent fetchData={fetchData} />,
      formId: "create-organization-form",
      open: true,
      title: tOrganizations("actions.create.title"),
    });
  };

  const handleUpdateOrganization = useCallback(
    (organization: Organization) => {
      setDialog({
        content: (
          <UpdateOrganizationDialogContent
            fetchData={fetchData}
            organization={organization}
          />
        ),
        formId: "update-organization-form",
        open: true,
        title: tOrganizations("actions.update.title"),
      });
    },
    [fetchData, setDialog, tOrganizations],
  );

  const handleDeleteOrganization = useCallback(
    ({ id, name }: Organization) => {
      setDialog({
        content: (
          <DialogContentText>
            {tOrganizations.rich("actions.delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.delete(
            { organizationId: id },
            {
              onError: ({ error: { code } }) => {
                const message = getErrorMessage(code, locale);
                enqueueSnackbar(message, { variant: "error" });
              },
              onSuccess: () => {
                const message = tOrganizations("actions.delete.success");
                enqueueSnackbar(message, { variant: "success" });

                fetchData();
              },
            },
          );
        },
        open: true,
        title: tOrganizations("actions.delete.title"),
      });
    },
    [fetchData, locale, setDialog, tOrganizations],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tOrganizations("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Organization>) => {
          const { canDelete, canUpdate } = organizationPermissions[row.id];

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tOrganizations("actions.view.title")}>
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    router.push(`/organizations/${row.slug}`);
                  }}
                  size="small"
                >
                  <ManageAccounts fontSize="small" />
                </IconButton>
              </Tooltip>
              {canUpdate && (
                <Tooltip title={tOrganizations("actions.update.title")}>
                  <IconButton
                    onClick={(event) => {
                      event.stopPropagation();

                      handleUpdateOrganization(row);
                    }}
                    size="small"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDelete && (
                <Tooltip title={tOrganizations("actions.delete.title")}>
                  <IconButton
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();

                      handleDeleteOrganization(row);
                    }}
                    size="small"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        },
        resizable: false,
        sortable: false,
      },
      {
        field: "logo",
        headerName: tOrganizations("logo"),
        renderCell: ({
          row: { logo, name },
        }: GridRenderCellParams<Organization>) => (
          <Stack height="100%" flexDirection="row" alignItems="center">
            <StyledAvatar
              alt={name}
              src={logo || undefined}
              {...stringAvatar(name)}
            />
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        headerName: tOrganizations("name.label"),
      },
      {
        field: "slug",
        headerName: tOrganizations("slug.label"),
      },
      {
        field: "createdAt",
        headerName: tOrganizations("createdAt"),
        valueFormatter: (value: Date) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [
      format,
      handleDeleteOrganization,
      handleUpdateOrganization,
      organizationPermissions,
      router,
      tOrganizations,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Button
          onClick={handleCreateOrganization}
          size="small"
          startIcon={<AddBusiness />}
          variant="contained"
        >
          {tOrganizations("actions.create.title")}
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

export default Organizations;
