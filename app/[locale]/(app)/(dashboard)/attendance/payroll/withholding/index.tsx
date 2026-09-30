"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import TaxIdentityDialog from "./TaxIdentityDialog";
import UnitDialog from "./UnitDialog";

import EmptyCell from "@/components/EmptyCell";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { useRouter } from "@/i18n/navigation";

import { Download, Edit } from "@mui/icons-material";
import {
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  PayrollNonResidentPayment,
  PayrollWithholdingCertificate,
  PayrollWithholdingFile,
  PayrollWithholdingSummary,
} from "@/types/attendance";
import type { Organization } from "@/types/organizations";

import { attendanceErrorKey, fromCents, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const ActionsStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ANNUAL_AMOUNT_FIELDS = [
  "salaryCents",
  "salaryWithholdingCents",
  "voluntaryPensionCents",
  "retirementIncomeCents",
  "retirementWithholdingCents",
] as const;

const NON_RESIDENT_AMOUNT_FIELDS = [
  "salaryCents",
  "salaryWithholdingCents",
  "retirementIncomeCents",
  "retirementWithholdingCents",
] as const;

interface WithholdingProps {
  canManage: boolean;
  organization: Organization;
  summary: PayrollWithholdingSummary;
}

const Withholding = ({
  canManage,
  organization: { currency = "", slug: organizationSlug },
  summary: { certificates, nonResidentPayments, unit, year },
}: WithholdingProps) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const { setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const monthFormat = useMonthFormat();

  const router = useRouter();

  const updateQuery = useUpdateQuery();

  const refresh = useCallback(() => router.refresh(), [router]);

  const blockedReason = useCallback(
    (rows: { identityComplete: boolean }[]) => {
      const missing = rows.filter(({ identityComplete }) => !identityComplete);

      return !unit
        ? tAttendance("withholding.unitRequired")
        : missing.length
          ? tAttendance("withholding.identitiesMissing", {
              count: missing.length,
            })
          : !rows.length
            ? tAttendance("withholding.noCertificates")
            : null;
    },
    [tAttendance, unit],
  );

  const annualBlockedReason = blockedReason(certificates);

  const handleUnitDialog = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <UnitDialog
            mutate={refresh}
            organizationSlug={organizationSlug}
            unit={unit ?? null}
          />
        ),
        formId: "payroll-withholding-unit-form",
        open: true,
        title: tAttendance("withholding.unit.title"),
      }),
    [organizationSlug, refresh, setDialog, tAttendance, unit],
  );

  const handleTaxIdentityDialog = useCallback(
    (employeeId: string, employeeName: string, foreign: boolean) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TaxIdentityDialog
            employeeId={employeeId}
            foreign={foreign}
            mutate={refresh}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "payroll-tax-identity-form",
        open: true,
        title: tAttendance("withholding.identity.title", {
          name: employeeName,
        }),
      }),
    [organizationSlug, refresh, setDialog, tAttendance],
  );

  const download = useCallback(
    async (key: string, path: string, query: Record<string, string>) => {
      try {
        setDownloading(key);

        const { content, fileName } = await fetcher<PayrollWithholdingFile>(
          `${payrollPath(organizationSlug, "org", path)}?${new URLSearchParams(query)}`,
        );

        const url = URL.createObjectURL(
          new Blob([content], { type: "text/plain;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
          variant: "error",
        });
      } finally {
        setDownloading(null);
      }
    },
    [organizationSlug, tAttendance],
  );

  const amountColumn = useCallback(
    (field: string): GridColDef => ({
      field,
      headerName: tAttendance(`withholding.amounts.${field}`),
      type: "number",
      valueFormatter: (value: string) =>
        formatMoney(fromCents(value), currency, { minimumFractionDigits: 2 }),
    }),
    [currency, formatMoney, tAttendance],
  );

  const identityColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: "employeeName",
        headerName: tAttendance("employee"),
      },
      {
        field: "taxIdMasked",
        headerName: tAttendance("withholding.taxId"),
        renderCell: ({ value }: GridRenderCellParams) => value ?? <EmptyCell />,
      },
      {
        field: "identityComplete",
        headerName: tAttendance("withholding.identityStatus"),
        renderCell: ({ value }: GridRenderCellParams) => (
          <Chip
            color={value ? "success" : "warning"}
            label={tAttendance(value ? "provided" : "notProvided")}
            size="small"
            variant="outlined"
          />
        ),
        type: "boolean",
      },
    ],
    [tAttendance],
  );

  const annualColumns = useMemo<GridColDef[]>(
    () => [
      ...(canManage
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<PayrollWithholdingCertificate>) => (
                <ActionsStack direction="row">
                  <Tooltip title={tAttendance("withholding.identity.edit")}>
                    <IconButton
                      onClick={() =>
                        handleTaxIdentityDialog(
                          row.employeeId,
                          row.employeeName,
                          row.idType !== "0",
                        )
                      }
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ActionsStack>
              ),
              resizable: false,
              sortable: false,
            } satisfies GridColDef,
          ]
        : []),
      ...identityColumns,
      {
        field: "idType",
        headerName: tAttendance("withholding.idType.label"),
        valueFormatter: (value: PayrollWithholdingCertificate["idType"]) =>
          tAttendance(`withholding.idType.options.${value}`),
      },
      {
        field: "certificateRequested",
        headerName: tAttendance("withholding.issuance.label"),
        type: "boolean",
        renderCell: ({
          value,
        }: GridRenderCellParams<PayrollWithholdingCertificate>) => (
          <Chip
            label={tAttendance(
              value
                ? "withholding.issuance.requested"
                : "withholding.issuance.exempt",
            )}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        field: "period",
        headerName: tAttendance("withholding.period"),
        valueGetter: (
          _value,
          { periodFrom, periodTo }: PayrollWithholdingCertificate,
        ) =>
          `${dayjs(periodFrom, "YYYY-MM").format(monthFormat)}–${dayjs(periodTo, "YYYY-MM").format(monthFormat)}`,
      },
      ...ANNUAL_AMOUNT_FIELDS.map(amountColumn),
    ],
    [
      amountColumn,
      canManage,
      handleTaxIdentityDialog,
      identityColumns,
      monthFormat,
      tAttendance,
    ],
  );

  const nonResidentColumns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tAttendance("actions"),
        renderCell: ({
          row,
        }: GridRenderCellParams<PayrollNonResidentPayment>) => {
          const reason = blockedReason(
            nonResidentPayments.filter(
              ({ paymentDate }) => paymentDate === row.paymentDate,
            ),
          );

          return (
            <ActionsStack direction="row">
              {canManage && (
                <Tooltip title={tAttendance("withholding.identity.edit")}>
                  <IconButton
                    onClick={() =>
                      handleTaxIdentityDialog(
                        row.employeeId,
                        row.employeeName,
                        true,
                      )
                    }
                    size="small"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip
                title={
                  reason ??
                  tAttendance("withholding.downloadPayment", {
                    date: format.dateTime(
                      new Date(`${row.paymentDate}T00:00:00`),
                      "date",
                    ),
                  })
                }
              >
                <span>
                  <IconButton
                    disabled={!!reason}
                    loading={downloading === row.paymentDate}
                    onClick={() =>
                      download(
                        row.paymentDate,
                        "withholding-file/non-resident",
                        {
                          paymentDate: row.paymentDate,
                        },
                      )
                    }
                    size="small"
                  >
                    <Download fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </ActionsStack>
          );
        },
        resizable: false,
        sortable: false,
      },
      {
        field: "paymentDate",
        headerName: tAttendance("withholding.paymentDate"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(`${value}T00:00:00`), "date"),
      },
      {
        field: "deadline",
        headerName: tAttendance("withholding.deadline"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(`${value}T00:00:00`), "date"),
      },
      ...identityColumns,
      ...NON_RESIDENT_AMOUNT_FIELDS.map(amountColumn),
    ],
    [
      amountColumn,
      blockedReason,
      canManage,
      download,
      downloading,
      format,
      handleTaxIdentityDialog,
      identityColumns,
      nonResidentPayments,
      tAttendance,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        <DatePicker
          label={tAttendance("withholding.year")}
          onChange={(value) =>
            value?.isValid() && updateQuery({ year: String(value.year()) })
          }
          value={dayjs(`${year}-01-01`)}
          views={["year"]}
        />
        {canManage && (
          <Button onClick={handleUnitDialog} variant="outlined">
            {tAttendance("withholding.unit.title")}
          </Button>
        )}
        <Tooltip title={annualBlockedReason ?? ""}>
          <span>
            <Button
              disabled={!!annualBlockedReason}
              loading={downloading === "annual"}
              onClick={() =>
                download("annual", "withholding-file", { year: String(year) })
              }
              startIcon={<Download />}
              variant="contained"
            >
              {tAttendance("withholding.download")}
            </Button>
          </span>
        </Tooltip>
      </ToolbarStack>
      {unit && (
        <Typography color="textSecondary" variant="body2">
          {tAttendance("withholding.unit.summary", {
            businessNumber: unit.businessNumber,
            name: unit.name,
          })}
        </Typography>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={annualColumns}
        getRowId={({ employeeId }) => employeeId}
        rows={certificates}
      />
      {nonResidentPayments.length > 0 && (
        <>
          <Typography component="h2" variant="h6">
            {tAttendance("withholding.nonResident.title")}
          </Typography>
          <DataGrid
            {...DATA_GRID_PROPS}
            columns={nonResidentColumns}
            getRowId={({ employeeId, paymentDate }) =>
              `${paymentDate}-${employeeId}`
            }
            rows={nonResidentPayments}
          />
        </>
      )}
    </>
  );
};

export default Withholding;
