"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import ConfirmRuleSetDialog from "./ConfirmRuleSetDialog";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";

import { CloudSync, TaskAlt } from "@mui/icons-material";
import { Alert, Button, Chip, IconButton, Stack, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  PayrollRuleIngestResult,
  PayrollRuleSet,
} from "@/types/attendance";

import { fromCents, PAYROLL_RULE_SETS_PATH } from "@/utils/attendance";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ActionsStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const RATE_FIELDS = [
  "laborPercentBp",
  "employmentPercentBp",
  "healthPercentBp",
  "withholdingRateBp",
] as const;

const WAGE_FIELDS = [
  "minimumMonthlyWageCents",
  "minimumHourlyWageCents",
] as const;

const isUnconfirmed = ({ unconfirmed }: PayrollRuleSet) =>
  unconfirmed.includes("minimumHourlyWageCents");

const STATUS_COLORS = {
  confirmed: "success",
  stale: "error",
  unconfirmed: "warning",
} as const;

const getStatus = (ruleSet: PayrollRuleSet): keyof typeof STATUS_COLORS =>
  ruleSet.stale
    ? "stale"
    : isUnconfirmed(ruleSet)
      ? "unconfirmed"
      : "confirmed";

interface PayrollRuleSetsProps {
  ruleSets: PayrollRuleSet[];
}

const PayrollRuleSets = ({ ruleSets }: PayrollRuleSetsProps) => {
  const [ingesting, setIngesting] = useState(false);

  const { setDialog } = useDialogStore((state) => state);

  const tPayrollRuleSets = useTranslations("payrollRuleSets");

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const monthFormat = useMonthFormat();

  const {
    data: rows = ruleSets,
    isValidating,
    mutate,
  } = useSWR<PayrollRuleSet[]>(PAYROLL_RULE_SETS_PATH, {
    fallbackData: ruleSets,
  });

  const formatMonth = useCallback(
    (effectiveFrom: string) =>
      dayjs(effectiveFrom, "YYYY-MM").format(monthFormat),
    [monthFormat],
  );

  const handleConfirm = useCallback(
    ({ effectiveFrom }: PayrollRuleSet) =>
      setDialog({
        content: (
          <ConfirmRuleSetDialog
            effectiveFrom={effectiveFrom}
            mutate={mutate}
            period={formatMonth(effectiveFrom)}
          />
        ),
        formId: "confirm-rule-set-form",
        open: true,
        title: tPayrollRuleSets("confirm.title"),
      }),
    [formatMonth, mutate, setDialog, tPayrollRuleSets],
  );

  const handleIngest = async () => {
    try {
      setIngesting(true);

      const { checked, rejected, skipped, written } =
        await fetcher<PayrollRuleIngestResult>(
          `${PAYROLL_RULE_SETS_PATH}/ingest`,
          { method: "POST" },
        );

      const periods = (values: string[]) =>
        values.length
          ? format.list(values.map(formatMonth), "enumeration")
          : tPayrollRuleSets("ingest.none");

      const result = tPayrollRuleSets("ingest.result", {
        rejected: periods(rejected),
        skipped: periods(skipped),
        written: periods(written),
      });

      enqueueSnackbar(
        checked ? result : `${result} ${tPayrollRuleSets("ingest.unchecked")}`,
        { variant: checked ? "success" : "warning" },
      );

      mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setIngesting(false);
    }
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tPayrollRuleSets("actions"),
        renderCell: ({ row }: GridRenderCellParams<PayrollRuleSet>) =>
          isUnconfirmed(row) && (
            <ActionsStack direction="row">
              <Tooltip title={tPayrollRuleSets("confirm.title")}>
                <IconButton onClick={() => handleConfirm(row)} size="small">
                  <TaskAlt fontSize="small" />
                </IconButton>
              </Tooltip>
            </ActionsStack>
          ),
        resizable: false,
        sortable: false,
      },
      {
        field: "effectiveFrom",
        headerName: tPayrollRuleSets("effectiveFrom"),
        valueFormatter: formatMonth,
      },
      ...WAGE_FIELDS.map(
        (field): GridColDef => ({
          field,
          headerName: tPayrollRuleSets(field),
          type: "number",
          valueFormatter: (value: number) => formatMoney(value, null),
          valueGetter: (_value, { rules }: PayrollRuleSet) =>
            fromCents(rules[field]),
        }),
      ),
      ...RATE_FIELDS.map(
        (field): GridColDef => ({
          field,
          headerName: tPayrollRuleSets(field),
          type: "number",
          valueFormatter: (value: number) =>
            format.number(value, {
              maximumFractionDigits: 2,
              style: "percent",
            }),
          valueGetter: (_value, { rules }: PayrollRuleSet) =>
            rules[field] / 10000,
        }),
      ),
      {
        field: "checkedAt",
        headerName: tPayrollRuleSets("checkedAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "dateTime") : "",
      },
      {
        field: "status",
        headerName: tPayrollRuleSets("status.label"),
        renderCell: ({ row }: GridRenderCellParams<PayrollRuleSet>) => (
          <Chip
            color={STATUS_COLORS[getStatus(row)]}
            label={tPayrollRuleSets(`status.${getStatus(row)}`)}
            size="small"
            variant="outlined"
          />
        ),
        valueGetter: (_value, row: PayrollRuleSet) =>
          tPayrollRuleSets(`status.${getStatus(row)}`),
      },
    ],
    [format, formatMoney, formatMonth, handleConfirm, tPayrollRuleSets],
  );

  return (
    <>
      {rows.some(({ stale }) => stale) && (
        <Alert severity="warning">
          {tPayrollRuleSets("staleAlert", {
            ingest: tPayrollRuleSets("ingest.label"),
          })}
        </Alert>
      )}
      <ToolbarStack direction="row">
        <Button
          loading={ingesting}
          onClick={handleIngest}
          size="small"
          startIcon={<CloudSync />}
          variant="contained"
        >
          {tPayrollRuleSets("ingest.label")}
        </Button>
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        loading={isValidating}
        rows={rows}
      />
    </>
  );
};

export default PayrollRuleSets;
