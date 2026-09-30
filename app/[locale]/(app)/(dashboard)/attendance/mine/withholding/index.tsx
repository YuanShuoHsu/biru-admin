"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { Fragment } from "react";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";

import { useRouter } from "@/i18n/navigation";

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

import { attendanceErrorKey, fromCents, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

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
  organization: { currency = "", slug: organizationSlug },
}: MyWithholdingProps) => {
  const tAttendance = useTranslations("attendance");

  const format = useFormatter();

  const router = useRouter();

  const titleOf = ({ kind, paymentDate, year }: MyWithholdingCertificate) =>
    kind === "nonResident" && paymentDate
      ? tAttendance("withholding.paymentCertificateTitle", {
          date: format.dateTime(new Date(`${paymentDate}T00:00:00`), "date"),
        })
      : tAttendance("withholding.certificateTitle", { year });

  const handleRequest = async ({ year }: MyWithholdingCertificate) => {
    try {
      await fetcher(
        payrollPath(
          organizationSlug,
          "me",
          `withholding-certificates/${year}/request`,
        ),
        { method: "POST" },
      );

      enqueueSnackbar(tAttendance("withholding.requested", { year }), {
        variant: "success",
      });

      router.refresh();
    } catch (error) {
      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
        variant: "error",
      });
    }
  };

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
      [
        tAttendance(
          certificate.idType === "0"
            ? "withholding.taxId"
            : "withholding.residentCertificateId",
        ),
        certificate.taxId,
      ],
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
    const title = titleOf(certificate);
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
        <Card
          key={certificate.paymentDate ?? certificate.year}
          variant="outlined"
        >
          <CardHeader title={titleOf(certificate)} />
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
            {!certificate.requested && (
              <Button onClick={() => handleRequest(certificate)}>
                {tAttendance("withholding.request")}
              </Button>
            )}
          </CardActions>
        </Card>
      ))}
    </CardsStack>
  );
};

export default MyWithholding;
