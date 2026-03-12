"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";

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
import { Button, IconButton, Stack, Tooltip } from "@mui/material";
import type {
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date | string;
  members?: { id: string }[];
};

interface OrganizationsProps {
  organizations: Organization[];
}

const Organizations = ({ organizations }: OrganizationsProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const router = useRouter();

  const tOrganizations = useTranslations("organizations");

  const handleOpenCreate = () => {
    setDialog({
      open: true,
      title: tOrganizations("create.title"),
      content: <CreateOrgDialogContent key={Date.now()} />,
    });
  };

  const handleOpenDeleteConfirm = (org: Organization) => {
    setDialog({
      open: true,
      title: tOrganizations("delete.title"),
      contentText: tOrganizations("delete.confirm", { name: org.name }),
      cancelText: "取消",
      confirmText: "確認刪除",
      onConfirm: async () => {
        const result = await authClient.organization.delete({
          organizationId: org.id,
        });
        if (result.error) {
          throw new Error(tOrganizations("delete.error"));
        }
        enqueueSnackbar(tOrganizations("delete.success"), {
          variant: "success",
        });
        router.refresh();
      },
    });
  };

  const columns: GridColDef<GridValidRowModel>[] = [
    {
      field: "actions",
      headerName: tOrganizations("columns.actions"),
      width: 110,
      sortable: false,
      renderCell: ({ row: r }: GridRenderCellParams) => {
        const row = r as Organization;
        return (
          <Stack direction="row" gap={0.5} alignItems="center" height="100%">
            <Tooltip title={tOrganizations("actions.view")}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/organizations/${row.slug}`);
                }}
              >
                <Settings fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tOrganizations("actions.delete")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDeleteConfirm(row);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
    {
      field: "name",
      headerName: tOrganizations("columns.name"),
      flex: 1,
      minWidth: 160,
    },
    {
      field: "slug",
      headerName: tOrganizations("columns.slug"),
      flex: 1,
      minWidth: 140,
    },
    {
      field: "members",
      headerName: tOrganizations("columns.members"),
      width: 110,
      valueGetter: (_value: unknown, row: GridValidRowModel) =>
        (row as Organization).members?.length ?? 0,
    },
    {
      field: "createdAt",
      headerName: tOrganizations("columns.createdAt"),
      width: 170,
      valueFormatter: (value: string) =>
        value ? new Date(value).toLocaleString("zh-TW") : "",
    },
  ];

  return (
    <>
      <Stack direction="row">
        <Button onClick={handleOpenCreate} size="small" variant="contained">
          {tOrganizations("actions.create")}
        </Button>
      </Stack>
      <DataGrid
        columns={columns}
        disableRowSelectionOnClick
        getRowClassName={({ indexRelativeToCurrentPage }) =>
          indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        rows={organizations}
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
