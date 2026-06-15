"use client";

import { useTranslations } from "next-intl";

import ListRadioGroup from "@/components/ListRadioGroup";

import { Stack, TextField } from "@mui/material";

export type InvoiceType =
  | "certificate"
  | "company"
  | "donate"
  | "individual"
  | "mobile";

export interface InvoiceInfo {
  carruerNum: string;
  customerIdentifier: string;
  customerName: string;
  loveCode: string;
}

export const isInvoiceValid = (
  invoiceType: InvoiceType,
  invoiceInfo: InvoiceInfo,
) => {
  switch (invoiceType) {
    case "individual":
      return true;
    case "mobile":
      return /^\/[A-Z0-9+\-.]{7}$/.test(invoiceInfo.carruerNum);
    case "certificate":
      return /^[A-Z0-9]{16}$/.test(invoiceInfo.carruerNum);
    case "company":
      return (
        /^\d{8}$/.test(invoiceInfo.customerIdentifier) &&
        !!invoiceInfo.customerName
      );
    case "donate":
      return /^\d{3,7}$/.test(invoiceInfo.loveCode);
  }
};

const INVOICE_TYPES: InvoiceType[] = [
  "individual",
  "mobile",
  "certificate",
  "company",
  "donate",
];

interface InvoiceFormProps {
  invoiceInfo: InvoiceInfo;
  invoiceType: InvoiceType;
  setInvoiceInfo: React.Dispatch<React.SetStateAction<InvoiceInfo>>;
  setInvoiceType: React.Dispatch<React.SetStateAction<InvoiceType>>;
}

const InvoiceForm = ({
  invoiceInfo,
  invoiceType,
  setInvoiceInfo,
  setInvoiceType,
}: InvoiceFormProps) => {
  const tOrder = useTranslations("order");

  const handleTypeChange = (
    _: React.ChangeEvent<HTMLInputElement>,
    value: string,
  ) => setInvoiceType(value as InvoiceType);

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceInfo((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Stack gap={2}>
      <ListRadioGroup
        label={tOrder("checkout.invoice.title")}
        onChange={handleTypeChange}
        options={INVOICE_TYPES.map((type) => ({
          label: tOrder(`checkout.invoice.${type}`),
          value: type,
        }))}
        value={invoiceType}
      />
      {(invoiceType === "mobile" || invoiceType === "certificate") && (
        <TextField
          fullWidth
          helperText={tOrder(`checkout.invoice.${invoiceType}Format`)}
          label={tOrder("checkout.invoice.carruerNum")}
          name="carruerNum"
          onChange={handleInfoChange}
          required
          value={invoiceInfo.carruerNum}
        />
      )}
      {invoiceType === "company" && (
        <>
          <TextField
            fullWidth
            label={tOrder("checkout.invoice.customerIdentifier")}
            name="customerIdentifier"
            onChange={handleInfoChange}
            required
            value={invoiceInfo.customerIdentifier}
          />
          <TextField
            fullWidth
            label={tOrder("checkout.invoice.customerName")}
            name="customerName"
            onChange={handleInfoChange}
            required
            value={invoiceInfo.customerName}
          />
        </>
      )}
      {invoiceType === "donate" && (
        <TextField
          fullWidth
          helperText={tOrder("checkout.invoice.donateFormat")}
          label={tOrder("checkout.invoice.loveCode")}
          name="loveCode"
          onChange={handleInfoChange}
          required
          value={invoiceInfo.loveCode}
        />
      )}
    </Stack>
  );
};

export default InvoiceForm;
