"use client";

import { useTranslations } from "next-intl";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { Print } from "@mui/icons-material";
import {
  Alert,
  Button,
  Divider,
  GlobalStyles,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { PayrollStatement } from "@/types/attendance";

import { downloadAttendanceCsv, fromCents } from "@/utils/attendance";

const StatementStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const LineStack = styled(Stack)(({ theme }) => ({
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

const ActionsStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  gap: theme.spacing(1),
  paddingTop: theme.spacing(2),
}));

interface StatementDialogContentProps {
  canManage: boolean;
  currency: string;
  onTransition?: () => void;
  statement: PayrollStatement;
}

const StatementDialogContent = ({
  canManage,
  currency,
  onTransition,
  statement,
}: StatementDialogContentProps) => {
  const tAttendance = useTranslations("attendance");

  const formatMoney = useFormatMoney();

  const money = (value: string) =>
    formatMoney(fromCents(value), currency, { minimumFractionDigits: 2 });

  return (
    <>
      <StatementStack data-payroll-print>
        <Typography variant="h5">
          {statement.employeeName} · {statement.month}
        </Typography>
        <Typography>
          {tAttendance(`payrollStatus.options.${statement.status}`)} ·{" "}
          {tAttendance("version")} {statement.version}
        </Typography>
        {statement.snapshot.blockers.length > 0 && (
          <Alert severity="warning">
            <Typography>{tAttendance("errors.payrollBlocked")}</Typography>
            {statement.snapshot.blockers.map((blocker) => (
              <Typography key={blocker} variant="body2">
                {tAttendance(`errors.${blocker}`)}
              </Typography>
            ))}
          </Alert>
        )}
        {statement.snapshot.lines.map((line) => (
          <LineStack key={line.code} direction="row">
            <Typography>
              {tAttendance(`payrollLine.options.${line.code}`)}
            </Typography>
            <Typography>{money(line.amountCents)}</Typography>
          </LineStack>
        ))}
        <Divider />
        <Typography>
          {tAttendance("gross")}: {money(statement.snapshot.grossCents)}
        </Typography>
        <Typography>
          {tAttendance("deductions")}:{" "}
          {money(statement.snapshot.deductionCents)}
        </Typography>
        <Typography variant="h6">
          {tAttendance("net")}: {money(statement.snapshot.netCents)}
        </Typography>
        <Typography variant="body2">
          {tAttendance("employerPension", { currency })}:{" "}
          {money(statement.snapshot.employerPensionCents)}
        </Typography>
        {canManage && (
          <Typography variant="body2">
            {tAttendance("sourceNote")}: {statement.snapshot.terms.sourceNote}
          </Typography>
        )}
      </StatementStack>
      <ActionsStack direction="row">
        <Button
          onClick={() =>
            downloadAttendanceCsv(
              `payslip-${statement.month}-v${statement.version}.csv`,
              [
                [tAttendance("employee"), statement.employeeName],
                [tAttendance("month"), statement.month],
                [tAttendance("version"), String(statement.version)],
                [
                  tAttendance("status.label"),
                  tAttendance(`payrollStatus.options.${statement.status}`),
                ],
                ...statement.snapshot.lines.map((line) => [
                  tAttendance(`payrollLine.options.${line.code}`),
                  money(line.amountCents),
                ]),
                [tAttendance("gross"), money(statement.snapshot.grossCents)],
                [
                  tAttendance("deductions"),
                  money(statement.snapshot.deductionCents),
                ],
                [tAttendance("net"), money(statement.snapshot.netCents)],
                [
                  tAttendance("employerPension", { currency }),
                  money(statement.snapshot.employerPensionCents),
                ],
              ],
            )
          }
        >
          {tAttendance("exportCsv")}
        </Button>
        <Button onClick={() => window.print()} startIcon={<Print />}>
          {tAttendance("print")}
        </Button>
        {canManage && statement.status !== "published" && (
          <Button
            disabled={statement.snapshot.blockers.length > 0}
            onClick={onTransition}
            variant="contained"
          >
            {tAttendance(statement.status === "draft" ? "approve" : "publish")}
          </Button>
        )}
      </ActionsStack>
      <GlobalStyles
        styles={{
          "@media print": {
            "body *": { visibility: "hidden" },
            "[data-payroll-print], [data-payroll-print] *": {
              visibility: "visible",
            },
            ".MuiDialog-root": { position: "absolute", inset: 0 },
            ".MuiDialog-container": { height: "auto", display: "block" },
            ".MuiDialog-paper": {
              margin: 0,
              maxWidth: "none",
              maxHeight: "none",
              overflow: "visible",
              boxShadow: "none",
            },
            "[data-payroll-print]": { overflow: "visible" },
          },
        }}
      />
    </>
  );
};

export default StatementDialogContent;
