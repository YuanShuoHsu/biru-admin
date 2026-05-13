"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";

import CreateMenuDialog from "./CreateMenuDialog";
import UpdateMenuDialog from "./UpdateMenuDialog";
import { useMenusFormSchema, type MenusForm } from "./definitions";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { locales } from "@/constants/locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { Add, Delete, Edit, Summarize } from "@mui/icons-material";
import {
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

import type { Menu } from "@/types/menus";
import type { Organization } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledTextField = styled(TextField)({
  width: 200,
});

interface MenusProps {
  canWrite: boolean;
  menus: Menu[];
  organizations: Organization[];
  organizationSlug: string;
}

const Menus = ({
  canWrite,
  menus: initialMenus,
  organizations,
  organizationSlug,
}: MenusProps) => {
  const [selectedSlug, setSelectedSlug] = useState(organizationSlug);

  const menusFormSchema = useMenusFormSchema();
  const {
    formState: { errors },
    register,
  } = useForm<MenusForm>({
    defaultValues: { organizationSlug },
    resolver: zodResolver(menusFormSchema),
  });

  const selectedOrganization = organizations.find(
    ({ slug }) => slug === selectedSlug,
  );
  const selectedOrganizationId = selectedOrganization?.id || "";

  const apiRef = useGridApiRef();

  const {
    data: menus = initialMenus,
    mutate: mutateMenus,
    isValidating,
  } = useSWR<Menu[]>(
    selectedOrganizationId
      ? `/api/organizations/${selectedOrganizationId}/menus`
      : null,
    {
      fallbackData: initialMenus,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const router = useRouter();

  const tMenus = useTranslations("menus");

  const sortedMenus = [...menus].sort((a, b) => {
    const aIndex = a.inLanguage
      ? routing.locales.indexOf(a.inLanguage)
      : Infinity;
    const bIndex = b.inLanguage
      ? routing.locales.indexOf(b.inLanguage)
      : Infinity;

    return aIndex - bIndex;
  });

  const usedInLanguages = menus
    .map(({ inLanguage }) => inLanguage)
    .filter((inLanguage) => inLanguage !== null);

  const handleCreateMenu = () => {
    setDialog({
      content: (
        <CreateMenuDialog
          mutateMenus={mutateMenus}
          organizationId={selectedOrganizationId}
          usedInLanguages={usedInLanguages}
        />
      ),
      formId: "create-menu-form",
      open: true,
      title: tMenus("actions.createMenu.title"),
    });
  };

  const handleViewMenu = useCallback(
    ({ id }: Menu) => {
      const searchParams = new URLSearchParams({
        ...(selectedSlug ? { organization: selectedSlug } : {}),
        page: "1",
        pageSize: "10",
      });
      router.push(`/menus/${id}?${searchParams.toString()}`);
    },
    [router, selectedSlug],
  );

  const handleUpdateMenu = useCallback(
    (menu: Menu) => {
      setDialog({
        content: <UpdateMenuDialog menu={menu} mutateMenus={mutateMenus} />,
        formId: "update-menu-form",
        open: true,
        title: tMenus("actions.updateMenu.title"),
      });
    },
    [mutateMenus, setDialog, tMenus],
  );

  const handleDeleteMenu = useCallback(
    ({ id, name }: Menu) => {
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

            mutateMenus();
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
    [mutateMenus, setDialog, tMenus],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        field: "actions",
        headerName: tMenus("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<Menu>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            <Tooltip title={tMenus("actions.viewMenu.title")}>
              <IconButton
                onClick={(event) => {
                  event.stopPropagation();

                  handleViewMenu(row);
                }}
                size="small"
              >
                <Summarize fontSize="small" />
              </IconButton>
            </Tooltip>
            {canWrite && (
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
            )}
            {canWrite && (
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
            )}
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
        renderCell: ({ row: { inLanguage } }: GridRenderCellParams<Menu>) =>
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
    [
      canWrite,
      format,
      handleDeleteMenu,
      handleUpdateMenu,
      handleViewMenu,
      tMenus,
    ],
  );

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
        <StyledTextField
          error={!!errors.organizationSlug}
          helperText={errors.organizationSlug?.message}
          label={tMenus("organization.label")}
          select
          size="small"
          slotProps={{
            inputLabel: { shrink: true },
            select: {
              displayEmpty: true,
              renderValue: (selected) => {
                const organization = organizations.find(
                  ({ slug }) => slug === selected,
                );

                return organization ? (
                  organization.name
                ) : (
                  <em>{tMenus("organization.placeholder")}</em>
                );
              },
            },
          }}
          value={selectedSlug}
          {...register("organizationSlug", {
            onChange: ({
              target: { value },
            }: React.ChangeEvent<HTMLInputElement>) => {
              setSelectedSlug(value);

              router.replace(`/menus?organization=${value}`);
            },
          })}
        >
          <MenuItem disabled value="">
            <em>{tMenus("organization.placeholder")}</em>
          </MenuItem>
          {organizations.map(({ id, slug, name }) => (
            <MenuItem key={id} value={slug}>
              {name}
            </MenuItem>
          ))}
        </StyledTextField>
        {canWrite && (
          <Button
            disabled={usedInLanguages.length >= routing.locales.length}
            onClick={handleCreateMenu}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tMenus("actions.createMenu.title")}
          </Button>
        )}
      </Stack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={isValidating}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={sortedMenus}
      />
    </>
  );
};

export default Menus;
