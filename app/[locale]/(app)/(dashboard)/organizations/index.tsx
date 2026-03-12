"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import CustomToolbar from "@/components/CustomToolbar";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import { Delete, Visibility } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import type {
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";

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

interface CreateOrgForm {
  name: string;
  slug: string;
}

interface ConfirmDeleteDialog {
  open: boolean;
  org: Organization | null;
}

interface OrganizationsProps {
  organizations: Organization[];
}

const Organizations = ({ organizations }: OrganizationsProps) => {
  const tOrganizations = useTranslations("organizations");
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDeleteDialog>({
    open: false,
    org: null,
  });

  const { control, handleSubmit, reset, setValue, formState } =
    useForm<CreateOrgForm>({
      defaultValues: { name: "", slug: "" },
    });

  const handleCloseCreate = () => {
    setCreateOpen(false);
    reset();
  };

  const handleCreateSubmit = async (values: CreateOrgForm) => {
    const result = await authClient.organization.create({
      name: values.name,
      slug: values.slug,
    });
    if (result.error) {
      enqueueSnackbar(tOrganizations("create.error"), { variant: "error" });
    } else {
      enqueueSnackbar(tOrganizations("create.success"), { variant: "success" });
      handleCloseCreate();
      router.refresh();
    }
  };

  const handleDelete = async (org: Organization) => {
    const result = await authClient.organization.delete({
      organizationId: org.id,
    });
    if (result.error) {
      enqueueSnackbar(tOrganizations("delete.error"), { variant: "error" });
    } else {
      enqueueSnackbar(tOrganizations("delete.success"), { variant: "success" });
      router.refresh();
    }
    setConfirmDialog({ open: false, org: null });
  };

  const handleNameChange = (name: string) => {
    setValue("name", name);
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setValue("slug", slug);
  };

  const columns: GridColDef<GridValidRowModel>[] = [
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
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tOrganizations("actions.delete")}>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDialog({ open: true, org: row });
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <>
      <DataGrid
        rows={organizations}
        columns={columns}
        disableRowSelectionOnClick
        autoHeight
        slots={{ toolbar: CustomToolbar }}
        showToolbar
      />
      <Dialog
        open={createOpen}
        onClose={handleCloseCreate}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(handleCreateSubmit)}>
          <DialogTitle>{tOrganizations("create.title")}</DialogTitle>
          <DialogContent>
            <Stack gap={2} pt={1}>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    onChange={(e) => handleNameChange(e.target.value)}
                    label={tOrganizations("create.fields.name")}
                    size="small"
                    fullWidth
                    required
                  />
                )}
              />
              <Controller
                name="slug"
                control={control}
                rules={{
                  required: true,
                  pattern: /^[a-z0-9-]+$/,
                }}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label={tOrganizations("create.fields.slug")}
                    size="small"
                    fullWidth
                    required
                    error={!!fieldState.error}
                    helperText={
                      fieldState.error
                        ? "只能使用小寫英文、數字與連字號"
                        : undefined
                    }
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate}>取消</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formState.isSubmitting}
            >
              {tOrganizations("actions.create")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, org: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{tOrganizations("delete.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tOrganizations("delete.confirm", {
              name: confirmDialog.org?.name ?? "",
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, org: null })}>
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => confirmDialog.org && handleDelete(confirmDialog.org)}
          >
            確認刪除
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Organizations;
