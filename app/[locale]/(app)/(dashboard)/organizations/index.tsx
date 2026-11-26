// https://mui.com/x/react-data-grid/column-dimensions/#ColumnAutosizingAsync.tsx
// https://mui.com/x/react-data-grid/pagination/
// https://mui.com/x/react-data-grid/performance/
// https://mui.com/x/react-data-grid/server-side-data/

"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import CreateOrganizationDialog from "./CreateOrganizationDialog";
import DeleteOrganizationConfirm, {
  DELETE_ORGANIZATION_FORM_ID,
} from "./DeleteOrganizationConfirm";
import UpdateOrganizationDialog from "./UpdateOrganizationDialog";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

import {
  useDefaultOrganizationSlug,
  useOrganizations,
} from "@/hooks/organizations";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useSession } from "@/hooks/useSession";

import { useRouter } from "@/i18n/navigation";

import { authClient } from "@/lib/auth-client";

import {
  AddBusiness,
  Cancel,
  Delete,
  DoNotDisturbOn,
  Edit,
  ManageAccounts,
  PersonAdd,
  Storefront,
} from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  styled,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  MyOrganization,
  OrganizationResponse,
} from "@/types/organizations";

import { stringAvatar } from "@/utils/avatar";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getOrganizations } from "@/utils/organizations";

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const AvatarStack = styled(Stack)({
  height: "100%",
  flexDirection: "row",
  alignItems: "center",
});

const StyledAvatar = styled(Avatar)({
  width: 24,
  height: 24,
  fontSize: 12,
});

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

type OrganizationRow = MyOrganization | OrganizationResponse;

const isMyOrganization = (row: OrganizationRow): row is MyOrganization =>
  "joinedAsPlatformAdmin" in row;

interface OrganizationsProps {
  loading?: boolean;
  organizations?: OrganizationResponse[];
  rows?: MyOrganization[];
}

const Organizations = ({
  loading = false,
  organizations: initialOrganizations = [],
  rows: initialRows = [],
}: OrganizationsProps) => {
  const [isSelectMode, setIsSelectMode] = useState(false);

  const apiRef = useGridApiRef();

  const isPlatformAdmin = useSession()?.user.role === "admin";

  const { mutate: mutateOrganizations } = useOrganizations();
  const { mutate: mutateDefaultOrganizationSlug } =
    useDefaultOrganizationSlug();

  const {
    data: rows = initialRows,
    mutate: mutateMyOrganizations,
    isValidating,
  } = useSWR<MyOrganization[]>(
    !loading && "/api/users/me/organizations",
    fetcher,
    {
      fallbackData: initialRows,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const { data: organizations = initialOrganizations } = useSWR(
    !loading && isPlatformAdmin && "/api/organizations?includeClosed=true",
    () => getOrganizations(),
    { fallbackData: initialOrganizations },
  );

  const gridRows = useMemo<OrganizationRow[]>(() => {
    const memberOrganizationIds = new Set(rows.map(({ id }) => id));

    return [
      ...rows,
      ...organizations.filter(({ id }) => !memberOrganizationIds.has(id)),
    ];
  }, [organizations, rows]);

  const mutate = useCallback(() => {
    mutateMyOrganizations();
    mutateOrganizations();
    mutateDefaultOrganizationSlug();
  }, [
    mutateMyOrganizations,
    mutateOrganizations,
    mutateDefaultOrganizationSlug,
  ]);

  const isOrganizationSelectable = useCallback(
    ({ deletable }: MyOrganization) => deletable,
    [],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    isRowSelectable: isOrganizationSelectable,
    rows,
  });

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const router = useRouter();

  const tOrganizations = useTranslations("organizations");

  const handleCreateOrganization = () => {
    setDialog({
      content: <CreateOrganizationDialog mutate={mutate} />,
      formId: "create-organization-form",
      open: true,
      title: tOrganizations("actions.createOrganization.title"),
    });
  };

  const handleUpdateOrganization = useCallback(
    (organization: MyOrganization) => {
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
    ({ id, name }: MyOrganization) => {
      setDialog({
        content: (
          <DeleteOrganizationConfirm
            names={[name]}
            onDelete={async () => {
              await authClient.organization.delete(
                { organizationId: id },
                {
                  onError: ({ error: { message } }) => {
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
            }}
          />
        ),
        formId: DELETE_ORGANIZATION_FORM_ID,
        open: true,
        title: tOrganizations("actions.deleteOrganization.title"),
      });
    },
    [mutate, setDialog, tOrganizations],
  );

  const handleEnterOrganizationBatchDeleteMode = useCallback(() => {
    setIsSelectMode(true);
    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef]);

  const handleSubmitOrganizationBatchDelete = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DeleteOrganizationConfirm
          names={selectedRows.map(({ name }) => name)}
          onDelete={async () => {
            try {
              await fetcher(`/api/organizations`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
              });

              setIsSelectMode(false);
              clearRowSelection();

              setTimeout(
                () => apiRef.current?.autosizeColumns(autosizeOptions),
                0,
              );

              enqueueSnackbar(
                tOrganizations(
                  "actions.batchDeleteOrganization.submit.success",
                  {
                    count,
                  },
                ),
                {
                  variant: "success",
                },
              );
            } catch (error) {
              enqueueSnackbar(getErrorMessage(error), {
                variant: "error",
              });
            }

            mutate();
          }}
        />
      ),
      formId: DELETE_ORGANIZATION_FORM_ID,
      open: true,
      title: tOrganizations("actions.batchDeleteOrganization.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    selectedRows,
    setDialog,
    tOrganizations,
  ]);

  const handleCancelOrganizationBatchDelete = useCallback(() => {
    setIsSelectMode(false);
    clearRowSelection();

    setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
  }, [apiRef, clearRowSelection]);

  const handleToggleClosed = useCallback(
    ({ closedAt, id, name }: MyOrganization) => {
      const action = closedAt ? "reopenOrganization" : "closeOrganization";

      setDialog({
        content: (
          <DialogContentText>
            {tOrganizations.rich(`actions.${action}.confirm`, {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              `/api/organizations/${id}/${closedAt ? "reopen" : "close"}`,
              { method: "POST" },
            );

            enqueueSnackbar(
              tOrganizations(`actions.${action}.success`, { name }),
              {
                variant: "success",
              },
            );

            mutate();
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), { variant: "error" });
          }
        },
        open: true,
        title: tOrganizations(`actions.${action}.title`),
      });
    },
    [mutate, setDialog, tOrganizations],
  );

  const handleJoinOrganization = useCallback(
    ({ id, name }: OrganizationResponse) => {
      setDialog({
        content: (
          <DialogContentText>
            {tOrganizations.rich("actions.joinAsPlatformAdmin.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              `/api/organizations/${id}/platform-admin-membership`,
              { method: "POST" },
            );

            enqueueSnackbar(
              tOrganizations("actions.joinAsPlatformAdmin.success", { name }),
              { variant: "success" },
            );

            mutate();
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), { variant: "error" });
          }
        },
        open: true,
        title: tOrganizations("actions.joinAsPlatformAdmin.title"),
      });
    },
    [mutate, setDialog, tOrganizations],
  );

  const canUpdateOrganizations = rows.some(({ canUpdate }) => canUpdate);
  const canDeleteOrganizations = rows.some(({ deletable }) => deletable);
  const hasMembershipColumn = gridRows.some(
    (row) => !isMyOrganization(row) || row.joinedAsPlatformAdmin,
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(!isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tOrganizations("actions.label"),
              renderCell: ({ row }: GridRenderCellParams<OrganizationRow>) => {
                if (!isMyOrganization(row))
                  return (
                    <ActionsStack direction="row">
                      <Tooltip
                        title={tOrganizations(
                          "actions.joinAsPlatformAdmin.title",
                        )}
                      >
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();

                            handleJoinOrganization(row);
                          }}
                          size="small"
                        >
                          <PersonAdd fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ActionsStack>
                  );

                const {
                  canUpdate: canUpdateOrganization,
                  deletable: canDeleteOrganization,
                } = row;

                return (
                  <ActionsStack direction="row">
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
                        title={tOrganizations(
                          "actions.updateOrganization.title",
                        )}
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
                        title={tOrganizations(
                          "actions.deleteOrganization.title",
                        )}
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
                    {isPlatformAdmin && (
                      <Tooltip
                        title={tOrganizations(
                          row.closedAt
                            ? "actions.reopenOrganization.title"
                            : "actions.closeOrganization.title",
                        )}
                      >
                        <IconButton
                          onClick={(event) => {
                            event.stopPropagation();

                            handleToggleClosed(row);
                          }}
                          size="small"
                        >
                          {row.closedAt ? (
                            <Storefront fontSize="small" />
                          ) : (
                            <DoNotDisturbOn fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                  </ActionsStack>
                );
              },
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "closedAt",
        headerName: tOrganizations("status.label"),
        renderCell: ({ value }: GridRenderCellParams<MyOrganization>) => (
          <Chip
            color={value ? "default" : "success"}
            label={tOrganizations(value ? "status.closed" : "status.open")}
            size="small"
          />
        ),
      },
      ...(hasMembershipColumn
        ? [
            {
              field: "joinedAsPlatformAdmin",
              headerName: tOrganizations("membership.label"),
              renderCell: ({ row }: GridRenderCellParams<OrganizationRow>) => {
                if (!isMyOrganization(row))
                  return (
                    <Chip
                      label={tOrganizations("membership.notJoined")}
                      size="small"
                      variant="outlined"
                    />
                  );

                return (
                  row.joinedAsPlatformAdmin && (
                    <Chip
                      color="primary"
                      label={tOrganizations("membership.joinedAsPlatformAdmin")}
                      size="small"
                      variant="outlined"
                    />
                  )
                );
              },
            },
          ]
        : []),
      {
        field: "logo",
        headerName: tOrganizations("logo"),
        renderCell: ({
          row: { logo, name, slug },
        }: GridRenderCellParams<MyOrganization>) => (
          <AvatarStack>
            <StyledAvatar
              alt={name}
              src={logo || undefined}
              {...stringAvatar(name, slug)}
            />
          </AvatarStack>
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
      handleJoinOrganization,
      handleToggleClosed,
      handleUpdateOrganization,
      hasMembershipColumn,
      isPlatformAdmin,
      isSelectMode,
      router,
      tOrganizations,
    ],
  );

  return (
    <>
      {(isPlatformAdmin || canDeleteOrganizations) && (
        <ToolbarStack direction="row">
          {!isSelectMode && (
            <>
              {isPlatformAdmin && (
                <Button
                  disabled={loading}
                  onClick={handleCreateOrganization}
                  size="small"
                  startIcon={<AddBusiness />}
                  variant="contained"
                >
                  {tOrganizations("actions.createOrganization.title")}
                </Button>
              )}
              {canDeleteOrganizations && (
                <Button
                  disabled={!hasSelectableRows}
                  onClick={handleEnterOrganizationBatchDeleteMode}
                  size="small"
                  startIcon={<Delete />}
                  variant="outlined"
                >
                  {tOrganizations("actions.batchDeleteOrganization.title")}
                </Button>
              )}
            </>
          )}
          {isSelectMode && (
            <>
              <Button
                onClick={handleCancelOrganizationBatchDelete}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tOrganizations("actions.batchDeleteOrganization.cancel.label")}
              </Button>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={handleSubmitOrganizationBatchDelete}
                size="small"
                startIcon={<Delete />}
                variant="contained"
              >
                {tOrganizations(
                  "actions.batchDeleteOrganization.submit.label",
                  { count: selectedRows.length },
                )}
              </Button>
            </>
          )}
        </ToolbarStack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        {...rowSelectionProps}
        apiRef={apiRef}
        columns={columns}
        loading={loading || isValidating}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={gridRows}
      />
    </>
  );
};

export default Organizations;
