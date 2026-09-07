import type { NumberFormatOptions, useFormatter } from "next-intl";

export const formatMoney = (
  value: number,
  currency: string | null | undefined,
  format: ReturnType<typeof useFormatter>,
  options?: NumberFormatOptions,
) => {
  const amount = format.number(value, options);

  return currency ? `${currency} ${amount}` : amount;
};
