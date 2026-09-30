"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";

import { Print } from "@mui/icons-material";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { MyWithholdingCertificate } from "@/types/attendance";
import type { Organization } from "@/types/organizations";

import { fromCents } from "@/utils/attendance";

const CardsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const FieldList = styled("dl")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "max-content 1fr",
  columnGap: theme.spacing(2),
  rowGap: theme.spacing(1),
  margin: 0,

  "& dd": { margin: 0 },
}));

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]!,
  );

interface MyWithholdingProps {
  certificates: MyWithholdingCertificate[];
  organization: Organization;
}

const MyWithholding = ({
  certificates,
  organization: { currency = "" },
}: MyWithholdingProps) => {
  const tAttendance = useTranslations("attendance");

  const formatMoney = useFormatMoney();

  const monthFormat = useMonthFormat();

  const money = (cents: string) =>
    formatMoney(fromCents(cents), currency, { minimumFractionDigits: 0 });

  const netCents = (totalCents: string, taxCents: string) =>
    (BigInt(totalCents) - BigInt(taxCents)).toString();

  const fieldsOf = (certificate: MyWithholdingCertificate) => {
    const salaryNet = netCents(
      certificate.salaryCents,
      certificate.salaryWithholdingCents,
    );

    return [
      [tAttendance("withholding.unit.fields.name"), certificate.unit.name],
      [
        tAttendance("withholding.unit.fields.businessNumber"),
        certificate.unit.businessNumber,
      ],
      [
        tAttendance("withholding.unit.fields.address"),
        certificate.unit.address,
      ],
      [
        tAttendance("withholding.unit.fields.agentName"),
        certificate.unit.agentName,
      ],
      [tAttendance("withholding.recipient"), certificate.employeeName],
      [tAttendance("withholding.taxId"), certificate.taxId],
      [tAttendance("withholding.address"), certificate.address],
      [
        tAttendance("withholding.period"),
        `${dayjs(certificate.periodFrom, "YYYY-MM").format(monthFormat)}–${dayjs(certificate.periodTo, "YYYY-MM").format(monthFormat)}`,
      ],
      [
        tAttendance("withholding.formats.salary"),
        tAttendance("withholding.amountSummary", {
          net: money(salaryNet),
          tax: money(certificate.salaryWithholdingCents),
          total: money(certificate.salaryCents),
        }),
      ],
      [
        tAttendance("withholding.amounts.voluntaryPensionCents"),
        money(certificate.voluntaryPensionCents),
      ],
      ...(BigInt(certificate.retirementIncomeCents) > BigInt(0)
        ? [
            [
              tAttendance("withholding.formats.retirement"),
              tAttendance("withholding.amountSummary", {
                net: money(
                  netCents(
                    certificate.retirementIncomeCents,
                    certificate.retirementWithholdingCents,
                  ),
                ),
                tax: money(certificate.retirementWithholdingCents),
                total: money(certificate.retirementIncomeCents),
              }),
            ],
          ]
        : []),
    ];
  };

  const handlePrint = (certificate: MyWithholdingCertificate) => {
    const title = tAttendance("withholding.certificateTitle", {
      year: certificate.year,
    });
    const rows = fieldsOf(certificate)
      .map(
        ([label, value]) =>
          `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
      )
      .join("");
    const printWindow = window.open("", "_blank");

    if (!printWindow) return;

    printWindow.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>body{font-family:sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:8px;text-align:left}th{width:30%;background:#f4f4f4}</style></head><body><h1>${escapeHtml(title)}</h1><table>${rows}</table></body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!certificates.length)
    return (
      <Typography color="textSecondary">
        {tAttendance("withholding.noMine")}
      </Typography>
    );

  return (
    <CardsStack>
      {certificates.map((certificate) => (
        <Card key={certificate.year} variant="outlined">
          <CardHeader
            title={tAttendance("withholding.certificateTitle", {
              year: certificate.year,
            })}
          />
          <CardContent>
            <FieldList>
              {fieldsOf(certificate).map(([label, value]) => (
                <Fragment key={label}>
                  <Typography color="textSecondary" component="dt">
                    {label}
                  </Typography>
                  <Typography component="dd">{value}</Typography>
                </Fragment>
              ))}
            </FieldList>
          </CardContent>
          <CardActions>
            <Button
              onClick={() => handlePrint(certificate)}
              startIcon={<Print />}
            >
              {tAttendance("withholding.print")}
            </Button>
          </CardActions>
        </Card>
      ))}
    </CardsStack>
  );
};

export default MyWithholding;
