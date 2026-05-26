// https://mui.com/x/react-data-grid/column-dimensions/#ColumnAutosizingAsync.tsx
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import CreateOrganizationDialog from "./CreateOrganizationDialog";
import UpdateOrganizationDialog from "./UpdateOrganizationDialog";

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

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/organizations";

import { stringAvatar } from "@/utils/avatar";
import {
  getOrganizationPermissions,
  type OrganizationPermissions,
} from "@/utils/organizations";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const StyledAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  fontSize: 12,
});

interface OrganizationsProps {
  organizationPermissions: OrganizationPermissions;
  rows: Organization[];
}

const Organizations = ({
  organizationPermissions: initialOrganizationPermissions,
  rows: initialRows,
}: OrganizationsProps) => {
  const apiRef = useGridApiRef();

  const {
    data: { rows, organizationPermissions } = {
      rows: initialRows,
      organizationPermissions: initialOrganizationPermissions,
    },
    mutate,
    isValidating: loading,
  } = useSWR(
    "organizations",
    async () => {
      const { data, error } = await authClient.organization.list();
      if (error) throw error;

      const organizations = data.toReversed();
      const organizationPermissions =
        await getOrganizationPermissions(organizations);

      return { rows: organizations, organizationPermissions };
    },
    {
      fallbackData: {
        rows: initialRows,
        organizationPermissions: initialOrganizationPermissions,
      },
      onError: (error) => {
        enqueueSnackbar(getErrorMessage(error.code, locale), {
          variant: "error",
        });
      },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const locale = useLocale();

  const router = useRouter();

  const tOrganizations = useTranslations("organizations");

  const handleCreateOrganization = () => {
    setDialog({
      content: (
        <CreateOrganizationDialog mutate={mutate} />
      ),
      formId: "create-organization-form",
      open: true,
      title: tOrganizations("actions.createOrganization.title"),
    });
  };

  const handleUpdateOrganization = useCallback(
    (organization: Organization) => {
      setDialog({
        content: (
          <UpdateOrganizationDialog
            mutate={mutate}
            organization={organization}
          />
        ),
        formId: "update-organization-form",
        open: true,
        title: tOrganizations("actions.updateOrganization.title"),
      });
    },
    [mutate, setDialog, tOrganizations],
  );

  const handleDeleteOrganization = useCallback(
    ({ id, name }: Organization) => {
      setDialog({
        content: (
          <DialogContentText>
            {tOrganizations.rich("actions.deleteOrganization.confirm", {
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
                const message = tOrganizations(
                  "actions.deleteOrganization.success",
                  { name },
                );
                enqueueSnackbar(message, { variant: "success" });

                mutate();
              },
            },
          );
        },
        open: true,
        title: tOrganizations("actions.deleteOrganization.title"),
      });
    },
    [locale, mutate, setDialog, tOrganizations],
  );

  const { canUpdateOrganizations, canDeleteOrganizations } = useMemo(() => {
    let canUpdateOrganizations = false;
    let canDeleteOrganizations = false;

    for (const {
      canUpdateOrganization,
      canDeleteOrganization,
    } of Object.values(organizationPermissions)) {
      canUpdateOrganizations ||= canUpdateOrganization;
      canDeleteOrganizations ||= canDeleteOrganization;

      if (canUpdateOrganizations && canDeleteOrganizations) break;
    }

    return { canUpdateOrganizations, canDeleteOrganizations };
  }, [organizationPermissions]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tOrganizations("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Organization>) => {
          const { canDeleteOrganization, canUpdateOrganization } =
            organizationPermissions[row.id];

          return (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip
                title={tOrganizations("actions.manageOrganization.title")}
              >
                <IconButton
                  onClick={(event) => {
                    event.stopPropagation();

                    router.push(`/organizations/${row.slug}/members`);
                  }}
                  size="small"
                >
                  <ManageAccounts fontSize="small" />
                </IconButton>
              </Tooltip>
              {canUpdateOrganizations && (
                <Tooltip
                  title={tOrganizations("actions.updateOrganization.title")}
                >
                  <StyledIconButton
                    onClick={(event) => {
                      event.stopPropagation();

                      handleUpdateOrganization(row);
                    }}
                    size="small"
                    visible={canUpdateOrganization}
                  >
                    <Edit fontSize="small" />
                  </StyledIconButton>
                </Tooltip>
              )}
              {canDeleteOrganizations && (
                <Tooltip
                  title={tOrganizations("actions.deleteOrganization.title")}
                >
                  <StyledIconButton
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();

                      handleDeleteOrganization(row);
                    }}
                    size="small"
                    visible={canDeleteOrganization}
                  >
                    <Delete fontSize="small" />
                  </StyledIconButton>
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
          row: { logo, name, slug },
        }: GridRenderCellParams<Organization>) => (
          <Stack height="100%" flexDirection="row" alignItems="center">
            <StyledAvatar
              alt={name}
              src={logo || undefined}
              {...stringAvatar(name, slug)}
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
      canDeleteOrganizations,
      canUpdateOrganizations,
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
          {tOrganizations("actions.createOrganization.title")}
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
