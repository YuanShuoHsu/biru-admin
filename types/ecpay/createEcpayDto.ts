export type EcpayLanguage = "" | "ENG" | "KOR" | "JPN" | "CHI";

interface BaseEcpayDto {
  MerchantID: string;
  MerchantTradeNo: string;
  MerchantTradeDate: string;
  PaymentType: "aio";
  TotalAmount: number;
  TradeDesc: string;
  ItemName: string;
  ReturnURL: string;
  ChoosePayment:
    | "Credit"
    | "TWQR"
    | "WebATM"
    | "ATM"
    | "CVS"
    | "BARCODE"
    | "ApplePay"
    | "BNPL"
    | "WeiXin"
    | "ALL";
  CheckMacValue: string;
  EncryptType: 1;
  StoreID?: string;
  ClientBackURL?: string;
  ItemURL?: string;
  Remark?: string;
  ChooseSubPayment?: string;
  OrderResultURL?: string;
  NeedExtraPaidInfo?: "Y" | "N";
  IgnorePayment?: string;
  PlatformID?: string;
  CustomField1?: string;
  CustomField2?: string;
  CustomField3?: string;
  CustomField4?: string;
  Language?: EcpayLanguage;
}

interface InvoiceEcpayDto {
  RelateNumber: string;
  CustomerID: string;
  CustomerIdentifier: string;
  CustomerName: string;
  CustomerAddr: string;
  CustomerPhone: string;
  CustomerEmail: string;
  ClearanceMark: string;
  TaxType: string;
  CarruerType: string;
  CarruerNum: string;
  Donation: string;
  LoveCode: string;
  Print: string;
  InvoiceItemName: string;
  InvoiceItemCount: string;
  InvoiceItemWord: string;
  InvoiceItemPrice: string;
  InvoiceItemTaxType: string;
  InvoiceRemark: string;
  DelayDay: string;
  InvType: string;
}

export interface CreateEcpayDto {
  base: Partial<BaseEcpayDto>;
  invoice?: Partial<InvoiceEcpayDto>;
}
