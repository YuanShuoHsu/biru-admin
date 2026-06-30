import type { components } from "@/types/api";

export type BaseEcpayDto = Omit<
  components["schemas"]["BaseEcpayDto"],
  | "CheckMacValue"
  | "EncryptType"
  | "MerchantID"
  | "MerchantTradeDate"
  | "MerchantTradeNo"
  | "PaymentType"
  | "ReturnURL"
>;

export type EcpayLanguage = components["schemas"]["BaseEcpayLanguage"];
