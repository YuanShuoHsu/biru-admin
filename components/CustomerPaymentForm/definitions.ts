import { useTranslations } from "next-intl";
import * as z from "zod";

export type InvoiceType = "company" | "donate" | "personal";
export type CarrierType = "certificate" | "individual" | "mobile";

export interface InvoiceInfo {
  carruerNum: string;
  customerIdentifier: string;
  customerName: string;
  loveCode: string;
}

export const useCustomerPaymentFormSchema = (isPickup: boolean) => {
  const tOrder = useTranslations("order");
  const tValidation = useTranslations("validation");

  return z
    .object({
      carrierType: z.enum(["certificate", "individual", "mobile"]),
      email: z.union([
        z.literal(""),
        z.email({ error: tValidation("email.invalid") }),
      ]),
      invoiceInfo: z.object({
        carruerNum: z.string().trim(),
        customerIdentifier: z.string().trim(),
        customerName: z.string().trim(),
        loveCode: z.string().trim(),
      }),
      invoiceType: z.enum(["company", "donate", "personal"]),
      name: z
        .string()
        .min(1, { error: tValidation("name.required") })
        .trim(),
      notes: z.string().trim(),
      payment: z.enum(["Cash", "Credit", "TWQR", "WeiXin"]).nullable(),
      phone: z.string().trim(),
    })
    .superRefine((data, ctx) => {
      if (isPickup && !data.phone) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("phone.required"),
          path: ["phone"],
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
          if (data.carrierType === "mobile") {
            if (!/^\/[A-Z0-9+\-.]{7}$/.test(data.invoiceInfo.carruerNum)) {
              ctx.addIssue({
                code: "custom",
                message: tOrder("checkout.invoice.mobileFormat"),
                path: ["invoiceInfo", "carruerNum"],
              });
            }
          } else if (data.carrierType === "certificate") {
            if (!/^[A-Z0-9]{16}$/.test(data.invoiceInfo.carruerNum)) {
              ctx.addIssue({
                code: "custom",
                message: tOrder("checkout.invoice.certificateFormat"),
                path: ["invoiceInfo", "carruerNum"],
              });
            }
          }
          break;
        case "company":
          if (!/^\d{8}$/.test(data.invoiceInfo.customerIdentifier)) {
            ctx.addIssue({
              code: "custom",
              message: tValidation("customerIdentifier.invalid"),
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
          if (!/^\d{3,7}$/.test(data.invoiceInfo.loveCode)) {
            ctx.addIssue({
              code: "custom",
              message: tOrder("checkout.invoice.donateFormat"),
              path: ["invoiceInfo", "loveCode"],
            });
          }
          break;
      }
    });
};

export type CustomerPaymentFormValues = z.infer<
  ReturnType<typeof useCustomerPaymentFormSchema>
>;
