"use client";

import { useTranslations } from "next-intl";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { Download, Print } from "@mui/icons-material";
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

const DetailStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const SectionStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const InfoRowStack = styled(Stack)(({ theme }) => ({
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const AmountTypography = styled(Typography)({
  flexShrink: 0,
});

const ValueTypography = styled(Typography)({
  wordBreak: "break-all",
});

const BoldTypography = styled(Typography)({
  fontWeight: "bold",
});

const ActionsStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  gap: theme.spacing(1),
}));

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <InfoRowStack direction="row">
    <Typography color="textSecondary" variant="body2">
      {label}
    </Typography>
    <ValueTypography variant="body2">{value}</ValueTypography>
  </InfoRowStack>
);

const AmountRow = ({ label, value }: { label: string; value: string }) => (
  <InfoRowStack direction="row">
    <Typography variant="body2">{label}</Typography>
    <AmountTypography variant="body2">{value}</AmountTypography>
  </InfoRowStack>
);

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

  const status = tAttendance(`payrollStatus.options.${statement.status}`);

  return (
    <>
      <DetailStack divider={<Divider />}>
        <SectionStack>
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
          <InfoRow label={tAttendance("status.label")} value={status} />
          {canManage && (
            <InfoRow
              label={tAttendance("sourceNote")}
              value={statement.snapshot.terms.sourceNote}
            />
          )}
        </SectionStack>
        <SectionStack>
          {statement.snapshot.lines.map((line) => (
            <AmountRow
              key={line.code}
              label={tAttendance(`payrollLine.options.${line.code}`)}
              value={money(line.amountCents)}
            />
          ))}
          <Divider />
          <InfoRow
            label={tAttendance("gross")}
            value={money(statement.snapshot.grossCents)}
          />
          <InfoRow
            label={tAttendance("deductions")}
            value={money(statement.snapshot.deductionCents)}
          />
          <InfoRowStack direction="row">
            <BoldTypography variant="subtitle1">
              {tAttendance("net")}
            </BoldTypography>
            <BoldTypography color="primary" variant="h6">
              {money(statement.snapshot.netCents)}
            </BoldTypography>
          </InfoRowStack>
          <InfoRow
            label={tAttendance("employerPension")}
            value={money(statement.snapshot.employerPensionCents)}
          />
        </SectionStack>
        <ActionsStack data-payroll-print-hidden direction="row">
          <Button
            onClick={() =>
              downloadAttendanceCsv(`payslip-${statement.month}.csv`, [
                [tAttendance("employee"), statement.employeeName],
                [tAttendance("month"), statement.month],
                [tAttendance("status.label"), status],
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
                  tAttendance("employerPension"),
                  money(statement.snapshot.employerPensionCents),
                ],
              ])
            }
            size="small"
            startIcon={<Download />}
            variant="outlined"
          >
            {tAttendance("exportCsv")}
          </Button>
          <Button
            onClick={() => window.print()}
            size="small"
            startIcon={<Print />}
            variant="outlined"
          >
            {tAttendance("print")}
          </Button>
          {canManage && statement.status !== "published" && (
            <Button
              disabled={statement.snapshot.blockers.length > 0}
              onClick={onTransition}
              size="small"
              variant="contained"
            >
              {tAttendance(
                statement.status === "draft" ? "approve" : "publish",
              )}
            </Button>
          )}
        </ActionsStack>
      </DetailStack>
      <GlobalStyles
        styles={{
          "@media print": {
            "body *": { visibility: "hidden" },
            ".MuiDialog-paper, .MuiDialog-paper *": { visibility: "visible" },
            ".MuiDialog-paper > .MuiIconButton-root, .MuiDialogActions-root, [data-payroll-print-hidden]":
              { display: "none" },
            ".MuiDialog-root": { position: "absolute", inset: 0 },
            ".MuiDialog-container": { height: "auto", display: "block" },
            ".MuiDialog-paper": {
              margin: 0,
              maxWidth: "none",
              maxHeight: "none",
              overflow: "visible",
              boxShadow: "none",
            },
          },
        }}
      />
    </>
  );
};

export default StatementDialogContent;
