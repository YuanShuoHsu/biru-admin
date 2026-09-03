import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { type CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import * as z from "zod";

import { ORDER_MODE } from "@/constants/orderMode";
import { PICKUP_MINUTES_STEP } from "@/constants/pickup";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import {
  createOrderDtoPaymentValues,
  createOrderInvoiceDtoCarrierTypeValues,
  createOrderInvoiceDtoTypeValues,
} from "@/types/api";
import type { OrganizationResponse } from "@/types/organizations";

import { getCartAvailableHours } from "@/utils/menus";
import { getCloseTimeAt, isOpenAt } from "@/utils/openingHours";
import { getPickupWindow } from "@/utils/pickup";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export type InvoiceType = (typeof createOrderInvoiceDtoTypeValues)[number];
export type CarrierType =
  | (typeof createOrderInvoiceDtoCarrierTypeValues)[number]
  | "none";

export const useCustomerPaymentFormSchema = (
  organization: OrganizationResponse,
) => {
  const { mode } = useParams();
  const isPickup = mode === ORDER_MODE.Pickup;

  const { cartItemsList } = useCartStore((state) => state);
  const { menu } = useMenuStore((state) => state);

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
      pickupTime: z.string(),
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

      if (isPickup) {
        const pickupTime = dayjs(data.pickupTime).tz(STORE_TIMEZONE);
        const leadMinutes = organization.pickupLeadMinutes;
        const advanceDays = organization.pickupMaxAdvanceDays;
        const { cutoffMinutes, from, openingHours, to } = getPickupWindow(
          organization,
          dayjs().tz(STORE_TIMEZONE),
        );

        const addPickupTimeIssue = (message: string) =>
          ctx.addIssue({ code: "custom", message, path: ["pickupTime"] });

        if (!data.pickupTime) {
          addPickupTimeIssue(tValidation("pickupTime.notSelected"));
        } else if (!pickupTime.isValid()) {
          addPickupTimeIssue(tValidation("pickupTime.invalid"));
        } else if (pickupTime.isBefore(from)) {
          addPickupTimeIssue(
            tValidation("pickupTime.minDateTime", { minutes: leadMinutes }),
          );
        } else if (pickupTime.isAfter(to)) {
          addPickupTimeIssue(
            tValidation("pickupTime.maxDateTime", { days: advanceDays }),
          );
        } else if (pickupTime.minute() % PICKUP_MINUTES_STEP !== 0) {
          addPickupTimeIssue(
            tValidation("pickupTime.minutesStep", {
              minutes: PICKUP_MINUTES_STEP,
            }),
          );
        } else if (!isOpenAt(openingHours, pickupTime)) {
          addPickupTimeIssue(tValidation("pickupTime.closed"));
        } else {
          const closeTime = getCloseTimeAt(openingHours, pickupTime);
          const unavailableItem = getCartAvailableHours(
            menu,
            cartItemsList,
          ).find(({ availableHours }) => !isOpenAt(availableHours, pickupTime));

          if (closeTime && closeTime.diff(pickupTime, "minute") < cutoffMinutes)
            addPickupTimeIssue(
              tValidation("pickupTime.beforeClosing", {
                minutes: cutoffMinutes,
              }),
            );
          else if (unavailableItem)
            addPickupTimeIssue(
              tValidation("pickupTime.itemUnavailable", {
                name: unavailableItem.name,
              }),
            );
        }
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
