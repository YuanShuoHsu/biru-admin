import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import * as z from "zod";

import { ORDER_MODE } from "@/constants/orderMode";

export type InvoiceType = "company" | "donate" | "personal";
export type CarrierType = "certificate" | "individual" | "mobile";

export const useCustomerPaymentFormSchema = () => {
  const { mode } = useParams();
  const isPickup = mode === ORDER_MODE.Pickup;

  const tValidation = useTranslations("validation");

  return z
    .object({
      carrierType: z.union([
        z.enum(["certificate", "individual", "mobile"]),
        z.literal(""),
      ]),
      email: z.union([
        z.literal(""),
        z.email({ error: tValidation("email.invalid") }),
      ]),
      invoiceInfo: z.object({
        address: z.string().trim(),
        carruerNum: z.string().trim(),
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
      }),
      invoiceType: z.enum(["company", "donate", "personal"]).nullable(),
      name: z
        .string()
        .trim()
        .min(1, { error: tValidation("name.required") }),
      notes: z
        .string()
        .trim()
        .max(160, { error: tValidation("notes.maxLength") }),
      payment: z.enum(["Cash", "Credit", "TWQR", "WeiXin"]).nullable(),
      phone: z
        .string()
        .trim()
        .refine((val) => !isPickup || !!val, tValidation("phone.required")),
    })
    .superRefine((data, ctx) => {
      if (!data.invoiceType) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("invoiceType.required"),
          path: ["invoiceType"],
        });
      }

      if (!data.payment) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("payment.required"),
          path: ["payment"],
        });
      }

      switch (data.invoiceType) {
        case "personal":
          if (data.carrierType === "individual") {
            if (!data.email) {
              ctx.addIssue({
                code: "custom",
                message: tValidation("email.required"),
                path: ["email"],
              });
            }
          } else if (data.carrierType === "mobile") {
            if (!/^\/[A-Z0-9+\-.]{7}$/.test(data.invoiceInfo.carruerNum)) {
              ctx.addIssue({
                code: "custom",
                message: tValidation("carruerNum.mobile.invalid"),
                path: ["invoiceInfo", "carruerNum"],
              });
            }
          } else if (data.carrierType === "certificate") {
            if (!/^[A-Z]{2}\d{14}$/.test(data.invoiceInfo.carruerNum)) {
              ctx.addIssue({
                code: "custom",
                message: tValidation("carruerNum.certificate.invalid"),
                path: ["invoiceInfo", "carruerNum"],
              });
            }
          }
          break;
        case "company":
          if (!data.invoiceInfo.address) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("customerAddr.required"),
              path: ["invoiceInfo", "address"],
            });
          }
          if (!data.invoiceInfo.customerIdentifier) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("customerIdentifier.required"),
              path: ["invoiceInfo", "customerIdentifier"],
            });
          }
          if (!data.invoiceInfo.customerName) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("customerName.required"),
              path: ["invoiceInfo", "customerName"],
            });
          }
          break;
        case "donate":
          if (!data.invoiceInfo.donateCode) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("donateCode.required"),
              path: ["invoiceInfo", "donateCode"],
            });
          }
          break;
      }
    });
};

export type CustomerPaymentFormValues = z.infer<
  ReturnType<typeof useCustomerPaymentFormSchema>
>;
