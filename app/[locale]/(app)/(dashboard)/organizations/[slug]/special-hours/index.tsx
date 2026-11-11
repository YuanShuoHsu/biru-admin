"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import SpecialHoursDialog from "./SpecialHoursDialog";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { Delete, Edit, EventBusy } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { SpecialHours } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";
import { formatOpeningHoursForDisplay } from "@/utils/openingHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface OrganizationsSlugSpecialHoursProps {
  organizationSlug: string;
}

const OrganizationsSlugSpecialHours = ({
  organizationSlug,
}: OrganizationsSlugSpecialHoursProps) => {
  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tCommon = useTranslations("common");
  const tSpecialHours = useTranslations("organizations.specialHours");

  const specialHoursUrl = `/api/organizations/${organizationSlug}/special-hours`;

  const {
    data: rows = [],
    isValidating,
    mutate,
  } = useSWR<SpecialHours[]>(specialHoursUrl, {
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  });

  const formatPeriod = useCallback(
    ({
      validFrom,
      validThrough,
    }: Pick<SpecialHours, "validFrom" | "validThrough">) =>
      format.dateTimeRange(
        dayjs.tz(validFrom, STORE_TIMEZONE).toDate(),
        dayjs.tz(validThrough, STORE_TIMEZONE).toDate(),
        "date",
      ),
    [format],
  );

  const handleCreate = () =>
    setDialog({
      content: (
        <SpecialHoursDialog
          formatPeriod={formatPeriod}
          mutate={mutate}
          organizationSlug={organizationSlug}
        />
      ),
      formId: "special-hours-form",
      open: true,
      title: tSpecialHours("actions.create.title"),
    });

  const handleUpdate = useCallback(
    (specialHours: SpecialHours) =>
      setDialog({
        content: (
          <SpecialHoursDialog
            formatPeriod={formatPeriod}
            mutate={mutate}
            organizationSlug={organizationSlug}
            specialHours={specialHours}
          />
        ),
        formId: "special-hours-form",
        open: true,
        title: tSpecialHours("actions.update.title"),
      }),
    [formatPeriod, mutate, organizationSlug, setDialog, tSpecialHours],
  );

  const handleRemove = useCallback(
    (specialHours: SpecialHours) => {
      const period = formatPeriod(specialHours);

      setDialog({
        content: (
          <DialogContentText>
            {tSpecialHours.rich("actions.remove.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              period,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`${specialHoursUrl}/${specialHours.id}`, {
              method: "DELETE",
            });

            enqueueSnackbar(
              tSpecialHours("actions.remove.success", { period }),
              {
                variant: "success",
              },
            );
          } finally {
            await mutate();
          }
        },
        open: true,
        title: tSpecialHours("actions.remove.title"),
      });
    },
    [formatPeriod, mutate, setDialog, specialHoursUrl, tSpecialHours],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tSpecialHours("actions.label"),
        renderCell: ({ row }: GridRenderCellParams<SpecialHours>) => (
          <ActionsStack direction="row">
            <Tooltip title={tSpecialHours("actions.update.title")}>
              <IconButton onClick={() => handleUpdate(row)} size="small">
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tSpecialHours("actions.remove.title")}>
              <IconButton
                color="error"
                onClick={() => handleRemove(row)}
                size="small"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </ActionsStack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "validFrom",
        headerName: tSpecialHours("period"),
        valueGetter: (_value: unknown, row: SpecialHours) => formatPeriod(row),
      },
      {
        field: "openingHours",
        headerName: tSpecialHours("openingHours.label"),
        valueGetter: (value: SpecialHours["openingHours"]) =>
          value === null
            ? tSpecialHours("closed.value")
            : formatOpeningHoursForDisplay(value, {
                formatDay: (day) => tCommon(`location.openingHours.${day}`),
                formatNextDayTime: (time) =>
                  tCommon("location.openingHours.nextDayTime", { time }),
                allDayLabel: tCommon("location.openingHours.allDay"),
                rangeSeparator: tCommon("location.openingHours.rangeSeparator"),
                delimiter: tCommon("delimiter"),
              }).join(tCommon("delimiter")),
      },
      {
        field: "note",
        headerName: tSpecialHours("note.label"),
      },
    ],
    [formatPeriod, handleRemove, handleUpdate, tCommon, tSpecialHours],
  );

  return (
    <>
      <ToolbarStack direction="row">
        <Button
          onClick={handleCreate}
          size="small"
          startIcon={<EventBusy />}
          variant="contained"
        >
          {tSpecialHours("actions.create.title")}
        </Button>
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        loading={isValidating}
        onPaginationModelChange={() =>
          apiRef.current?.autosizeColumns(autosizeOptions)
        }
        rows={rows}
      />
    </>
  );
};

export default OrganizationsSlugSpecialHours;
