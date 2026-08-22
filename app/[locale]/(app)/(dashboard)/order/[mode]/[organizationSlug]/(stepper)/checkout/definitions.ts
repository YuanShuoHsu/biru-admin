import { type CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import * as z from "zod";

import { ORDER_MODE } from "@/constants/orderMode";

import {
  createOrderDtoPaymentValues,
  createOrderInvoiceDtoCarrierTypeValues,
  createOrderInvoiceDtoTypeValues,
} from "@/types/api";

export type InvoiceType = (typeof createOrderInvoiceDtoTypeValues)[number];
export type CarrierType =
  | (typeof createOrderInvoiceDtoCarrierTypeValues)[number]
  | "none";

export const useCustomerPaymentFormSchema = () => {
  const { mode } = useParams();
  const isPickup = mode === ORDER_MODE.Pickup;

  const tValidation = useTranslations("validation");

  return z
    .object({
      coupon: z.string(),
      customer: z.object({
        countryCode: z
          .string()
          .min(1, { error: tValidation("countryCode.notSelected") }),
        email: z.union([
          z.literal(""),
          z.email({ error: tValidation("email.invalid") }),
        ]),
        name: z
          .string()
          .trim()
          .min(1, { error: tValidation("name.required") }),
        remark: z
          .string()
          .trim()
          .max(160, { error: tValidation("remark.maxLength") }),
        telephone: isPickup
          ? z
              .string()
              .trim()
              .min(1, { error: tValidation("telephone.required") })
          : z.string().trim(),
      }),
      invoice: z.object({
        carrierType: z.union([
          z.enum(createOrderInvoiceDtoCarrierTypeValues),
          z.literal("none"),
          z.literal(""),
        ]),
        carrierNum: z.string().trim(),
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
        type: z.enum(createOrderInvoiceDtoTypeValues).nullable(),
      }),
      payment: z.enum(createOrderDtoPaymentValues).nullable(),
    })
    .superRefine((data, ctx) => {
      if (
        data.customer.telephone &&
        !isValidPhoneNumber(
          data.customer.telephone,
          data.customer.countryCode as CountryCode,
        )
      ) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("telephone.invalid"),
          path: ["customer", "telephone"],
        });
      }

      if (!data.invoice.type) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("invoiceType.notSelected"),
          path: ["invoice", "type"],
        });
      } else if (!data.customer.email && !data.customer.telephone) {
        // 綠界 B2C 發票規定 CustomerEmail 與 CustomerPhone 擇一必填，兩欄皆空會被退件
        for (const field of ["email", "telephone"] as const) {
          ctx.addIssue({
            code: "custom",
            message: tValidation("contact.requiredForInvoice"),
            path: ["customer", field],
          });
        }
      }

      if (!data.payment) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("payment.notSelected"),
          path: ["payment"],
        });
      }

      switch (data.invoice.type) {
        case "personal":
          if (!data.invoice.carrierType) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("carrierType.notSelected"),
              path: ["invoice", "carrierType"],
            });
          } else if (data.invoice.carrierType === "mobile") {
            if (!/^\/[A-Z0-9+\-.]{7}$/.test(data.invoice.carrierNum)) {
              ctx.addIssue({
                code: "custom",
                message: tValidation("carrierNum.mobile.invalid"),
                path: ["invoice", "carrierNum"],
              });
            }
          } else if (data.invoice.carrierType === "certificate") {
            if (!/^[A-Z]{2}\d{14}$/.test(data.invoice.carrierNum)) {
              ctx.addIssue({
                code: "custom",
                message: tValidation("carrierNum.certificate.invalid"),
                path: ["invoice", "carrierNum"],
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
