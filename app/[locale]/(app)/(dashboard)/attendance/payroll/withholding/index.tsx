"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
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

const AMOUNT_FIELDS = [
  "salaryCents",
  "salaryWithholdingCents",
  "voluntaryPensionCents",
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
  summary: { certificates, unit, year },
}: WithholdingProps) => {
  const [downloading, setDownloading] = useState(false);

  const { setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const formatMoney = useFormatMoney();

  const monthFormat = useMonthFormat();

  const router = useRouter();

  const updateQuery = useUpdateQuery();

  const refresh = useCallback(() => router.refresh(), [router]);

  const missingIdentities = certificates.filter(
    ({ filable, taxIdMasked }) => filable && !taxIdMasked,
  ).length;

  const downloadBlockedReason = !unit
    ? tAttendance("withholding.unitRequired")
    : missingIdentities
      ? tAttendance("withholding.identitiesMissing", {
          count: missingIdentities,
        })
      : !certificates.some(({ filable }) => filable)
        ? tAttendance("withholding.noCertificates")
        : null;

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
    ({ employeeId, employeeName }: PayrollWithholdingCertificate) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <TaxIdentityDialog
            employeeId={employeeId}
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

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const { content, fileName } = await fetcher<PayrollWithholdingFile>(
        `${payrollPath(organizationSlug, "org", "withholding-file")}?${new URLSearchParams({ year: String(year) })}`,
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
      setDownloading(false);
    }
  };

  const columns = useMemo<GridColDef[]>(
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
              }: GridRenderCellParams<PayrollWithholdingCertificate>) =>
                row.filable && (
                  <ActionsStack direction="row">
                    <Tooltip title={tAttendance("withholding.identity.edit")}>
                      <IconButton
                        onClick={() => handleTaxIdentityDialog(row)}
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
      {
        field: "employeeName",
        headerName: tAttendance("employee"),
      },
      {
        field: "taxIdMasked",
        headerName: tAttendance("withholding.taxId"),
        renderCell: ({
          row: { filable, taxIdMasked },
        }: GridRenderCellParams<PayrollWithholdingCertificate>) =>
          filable ? (
            (taxIdMasked ?? <EmptyCell />)
          ) : (
            <Chip
              color="warning"
              label={tAttendance("withholding.fileSeparately")}
              size="small"
              variant="outlined"
            />
          ),
      },
      {
        field: "addressProvided",
        headerName: tAttendance("withholding.address"),
        renderCell: ({
          row: { addressProvided, filable },
        }: GridRenderCellParams<PayrollWithholdingCertificate>) =>
          filable && (
            <Chip
              color={addressProvided ? "success" : "default"}
              label={tAttendance(addressProvided ? "provided" : "notProvided")}
              size="small"
              variant="outlined"
            />
          ),
        type: "boolean",
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
      ...AMOUNT_FIELDS.map(
        (field): GridColDef => ({
          field,
          headerName: tAttendance(`withholding.amounts.${field}`),
          type: "number",
          valueFormatter: (value: string) =>
            formatMoney(fromCents(value), currency, {
              minimumFractionDigits: 2,
            }),
        }),
      ),
    ],
    [
      canManage,
      currency,
      formatMoney,
      handleTaxIdentityDialog,
      monthFormat,
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
        <Tooltip title={downloadBlockedReason ?? ""}>
          <span>
            <Button
              disabled={!!downloadBlockedReason}
              loading={downloading}
              onClick={handleDownload}
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
        columns={columns}
        getRowId={({ employeeId }) => employeeId}
        rows={certificates}
      />
    </>
  );
};

export default Withholding;
