import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import * as z from "zod";

import { ORDER_MODE } from "@/constants/orderMode";

export type InvoiceType = "company" | "donate" | "personal";
export type CarrierType = "certificate" | "individual" | "mobile";

export const useCustomerPaymentFormSchema = () => {
  const { mode } = useParams();
  const isKiosk = mode === ORDER_MODE.Kiosk;

  const tValidation = useTranslations("validation");

  return z
    .object({
      customer: z.object({
        email: z.union([
          z.literal(""),
          z.email({ error: tValidation("email.invalid") }),
        ]),
        name: z
          .string()
          .trim()
          .min(1, { error: tValidation("name.required") }),
        notes: z
          .string()
          .trim()
          .max(160, { error: tValidation("notes.maxLength") }),
        phone: isKiosk
          ? z.string().trim()
          : z
              .string()
              .trim()
              .min(1, { error: tValidation("phone.required") }),
      }),
      invoice: z.object({
        carrierType: z.union([
          z.enum(["certificate", "individual", "mobile"]),
          z.literal(""),
        ]),
        carruerNum: z.string().trim(),
        customerAddr: z.string().trim(),
        customerIdentifier: z
          .string()
          .trim()
          .refine(
            (val) => !val || /^\d{8}$/.test(val),
            tValidation("customerIdentifier.invalid"),
          ),
        customerName: z.string().trim(),
        donateCode: z
          .string()
          .trim()
          .refine(
            (val) => !val || /^\d{3,7}$/.test(val),
            tValidation("donateCode.invalid"),
          ),
        email: z.union([
          z.literal(""),
          z.email({ error: tValidation("email.invalid") }),
        ]),
        emailSameAsCustomer: z.boolean(),
        type: z.enum(["company", "donate", "personal"]).nullable(),
      }),
      payment: z
        .enum(["ApplePay", "Cash", "Credit", "iPASS", "Jkopay", "TWQR", "WeiXin"])
        .nullable(),
    })
    .superRefine((data, ctx) => {
      if (!data.invoice.type) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("invoiceType.required"),
          path: ["invoice", "type"],
        });
      }

      if (!data.payment) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("payment.required"),
          path: ["payment"],
        });
      }

      switch (data.invoice.type) {
        case "personal":
          if (!data.invoice.carrierType) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("carrierType.required"),
              path: ["invoice", "carrierType"],
            });
          } else if (data.invoice.carrierType === "mobile") {
            if (!/^\/[A-Z0-9+\-.]{7}$/.test(data.invoice.carruerNum)) {
              ctx.addIssue({
                code: "custom",
                message: tValidation("carruerNum.mobile.invalid"),
                path: ["invoice", "carruerNum"],
              });
            }
          } else if (data.invoice.carrierType === "certificate") {
            if (!/^[A-Z]{2}\d{14}$/.test(data.invoice.carruerNum)) {
              ctx.addIssue({
                code: "custom",
                message: tValidation("carruerNum.certificate.invalid"),
                path: ["invoice", "carruerNum"],
              });
            }
          }
          break;
        case "company":
          if (!data.invoice.customerAddr) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("customerAddr.required"),
              path: ["invoice", "customerAddr"],
            });
          }
          if (!data.invoice.customerIdentifier) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("customerIdentifier.required"),
              path: ["invoice", "customerIdentifier"],
            });
          }
          if (!data.invoice.customerName) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("customerName.required"),
              path: ["invoice", "customerName"],
            });
          }
          break;
        case "donate":
          if (!data.invoice.donateCode) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("donateCode.required"),
              path: ["invoice", "donateCode"],
            });
          }
          break;
      }
    });
};

export type CustomerPaymentFormValues = z.infer<
  ReturnType<typeof useCustomerPaymentFormSchema>
>;
