import { type NumberFormatOptions, useFormatter } from "next-intl";
import { useCallback } from "react";

export const useFormatMoney = () => {
  const format = useFormatter();

  return useCallback(
    (
      value: number,
      currency: string | null | undefined,
      options?: NumberFormatOptions,
    ) => {
      const amount = format.number(value, options);

      return currency ? `${currency} ${amount}` : amount;
    },
    [format],
  );
};
