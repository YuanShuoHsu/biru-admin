// https://mui.com/x/react-data-grid/column-dimensions/
// https://mui.com/x/react-data-grid/performance/

"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";

import CreateOrgDialogContent from "./CreateOrgDialogContent";

import CustomNoColumnsOverlay from "@/components/CustomNoColumnsOverlay";
import CustomNoResultsOverlay from "@/components/CustomNoResultsOverlay";
import CustomNoRowsOverlay from "@/components/CustomNoRowsOverlay";
import CustomPagination from "@/components/CustomPagination";
import {
  SortedAscendingIcon,
  SortedDescendingIcon,
  UnsortedIcon,
} from "@/components/CustomSortIcons";
import CustomToolbar from "@/components/CustomToolbar";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { Delete, Settings } from "@mui/icons-material";
import {
  Avatar,
  Button,
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

  const handleOpenCreate = () => {
    setDialog({
      cancelText: tOrganizations("create.cancel"),
      confirmText: tOrganizations("actions.create"),
      content: <CreateOrgDialogContent key={Date.now()} />,
      formId: "create-organization-form",
      open: true,
      title: tOrganizations("create.title"),
    });
  };

  const handleOpenDeleteConfirm = useCallback(
    (org: OrganizationRow) => {
      setDialog({
        cancelText: tOrganizations("delete.cancel"),
        confirmText: tOrganizations("delete.submit"),
        contentText: tOrganizations("delete.confirm", { name: org.name }),
        onConfirm: async () => {
          const result = await authClient.organization.delete({
            organizationId: org.id,
          });
          if (result.error) throw new Error(tOrganizations("delete.error"));

          enqueueSnackbar(tOrganizations("delete.success"), {
            variant: "success",
          });
          router.refresh();
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
                  onClick={(e) => {
                    e.stopPropagation();

                    router.push(`/organizations/${row.slug}`);
                  }}
                  size="small"
                >
                  <Settings fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={tOrganizations("actions.delete")}>
                <IconButton
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();

                    handleOpenDeleteConfirm(row);
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
        headerName: tOrganizations("columns.name"),
      },
      {
        field: "slug",
        headerName: tOrganizations("columns.slug"),
      },
      {
        field: "createdAt",
        headerName: tOrganizations("columns.createdAt"),
        valueFormatter: (value: Date | string) =>
          format.dateTime(new Date(value), "short"),
      },
    ],
    [format, handleOpenDeleteConfirm, router, tOrganizations],
  );

  return (
    <>
      <Stack direction="row">
        <Button onClick={handleOpenCreate} size="small" variant="contained">
          {tOrganizations("actions.create")}
        </Button>
      </Stack>
      <DataGrid
        autosizeOnMount
        columns={columns}
        disableRowSelectionOnClick
        getRowClassName={({ indexRelativeToCurrentPage }) =>
          indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        rows={rows}
        showToolbar
        slotProps={{
          basePagination: {
            material: {
              ActionsComponent: CustomPagination,
            },
          },
        }}
        slots={{
          columnSortedAscendingIcon: SortedAscendingIcon,
          columnSortedDescendingIcon: SortedDescendingIcon,
          columnUnsortedIcon: UnsortedIcon,
          noColumnsOverlay: CustomNoColumnsOverlay,
          noResultsOverlay: CustomNoResultsOverlay,
          noRowsOverlay: CustomNoRowsOverlay,
          toolbar: CustomToolbar,
        }}
      />
    </>
  );
};

export default Organizations;
