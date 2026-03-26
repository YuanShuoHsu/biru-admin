// https://mui.com/x/react-data-grid/column-dimensions/
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";

import CreateOrganizationDialogContent from "./CreateOrganizationDialogContent";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { Delete, ManageAccounts } from "@mui/icons-material";

import {
  Avatar,
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
  styled,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { stringAvatar } from "@/utils/avatar";

const StyledAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  fontSize: 12,
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date | string;
}

interface OrganizationsProps {
  rows: OrganizationRow[];
}

const Organizations = ({ rows }: OrganizationsProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const router = useRouter();

  const tOrganizations = useTranslations("organizations");

  const handleCreateOrganization = () => {
    setDialog({
      content: <CreateOrganizationDialogContent />,
      formId: "create-organization-form",
      open: true,
      title: tOrganizations("create.title"),
    });
  };

  const handleDeleteOrganization = useCallback(
    ({ id, name }: OrganizationRow) => {
      setDialog({
        content: (
          <DialogContentText>
            {tOrganizations.rich("delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          await authClient.organization.delete(
            { organizationId: id },
            {
              onError: () => {
                throw new Error(tOrganizations("delete.error"));
              },
              onSuccess: () => {
                enqueueSnackbar(tOrganizations("delete.success"), {
                  variant: "success",
                });
                router.refresh();
              },
            },
          );
        },
        open: true,
        title: tOrganizations("delete.title"),
      });
    },
    [router, setDialog, tOrganizations],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "actions",
        headerName: tOrganizations("columns.actions"),
        resizable: false,
        renderCell: ({ row }: GridRenderCellParams<OrganizationRow>) => {
          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tOrganizations("actions.view")}>
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
              <Tooltip title={tOrganizations("actions.delete")}>
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
            </Stack>
          );
        },
        sortable: false,
      },
      {
        field: "logo",
        headerName: tOrganizations("columns.logo"),
        renderCell: ({
          row: { logo, name },
        }: GridRenderCellParams<OrganizationRow>) => (
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
        headerName: tOrganizations("fields.name.label"),
      },
      {
        field: "slug",
        headerName: tOrganizations("fields.slug.label"),
      },
      {
        field: "createdAt",
        headerName: tOrganizations("columns.createdAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [format, handleDeleteOrganization, router, tOrganizations],
  );

  return (
    <>
      <Stack direction="row">
        <Button
          onClick={handleCreateOrganization}
          size="small"
          variant="contained"
        >
          {tOrganizations("create.title")}
        </Button>
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        rows={rows.toReversed()}
      />
    </>
  );
};

export default Organizations;
