import * as z from "zod";

import { useCashAmountSchema } from "../CashAmountField/definitions";

export const useOpenCashDrawerFormSchema = () =>
  z.object({ openingFloat: useCashAmountSchema() });

export type OpenCashDrawerForm = z.infer<
  ReturnType<typeof useOpenCashDrawerFormSchema>
>;
