export interface CurrencyType {
  code: string;
  currency: string;
  label: string;
}

export type CurrencyOption = CurrencyType & { firstLetter: string };
