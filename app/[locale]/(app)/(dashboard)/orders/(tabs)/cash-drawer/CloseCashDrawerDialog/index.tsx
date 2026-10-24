"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import CashAmountField from "../CashAmountField";
import { toCents } from "../CashAmountField/definitions";
import {
  type CloseCashDrawerForm,
  exceedsTolerance,
  useCloseCashDrawerFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { CashDrawerSession, CurrentCashDrawer } from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { cashDrawerPath } from "@/utils/orders";

interface CloseCashDrawerDialogProps {
  currency: string | null | undefined;
  mutate: () => void;
  organizationSlug: string;
  session: CashDrawerSession;
  varianceTolerance: string;
}

const CloseCashDrawerDialog = ({
  currency,
  mutate,
  organizationSlug,
  session: {
    id: sessionId,
    openingFloat,
    summary: { expectedCash: initialExpectedCash },
  },
  varianceTolerance: initialVarianceTolerance,
}: CloseCashDrawerDialogProps) => {
  const { data: current } = useSWR<CurrentCashDrawer>(
    `${cashDrawerPath(organizationSlug)}/current`,
  );

  const expectedCash =
    current?.session?.summary.expectedCash ?? initialExpectedCash;
  const varianceTolerance =
    current?.varianceTolerance ?? initialVarianceTolerance;

  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const formatMoney = useFormatMoney();

  const tOrders = useTranslations("orders");

  const closeCashDrawerFormSchema = useCloseCashDrawerFormSchema(
    expectedCash,
    varianceTolerance,
  );

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
    trigger,
  } = useForm<CloseCashDrawerForm>({
    defaultValues: {
      countedCash: "",
      retainedFloat: String(Number(openingFloat)),
      varianceNote: "",
    },
    resolver: zodResolver(closeCashDrawerFormSchema),
  });

  const [countedCash, retainedFloat] = useWatch({
    control,
    name: ["countedCash", "retainedFloat"],
  });

  const variance =
    countedCash === ""
      ? null
      : (toCents(countedCash) - toCents(expectedCash)) / 100;

  const money = (amount: number) =>
    formatMoney(amount, currency, { signDisplay: "exceptZero" });

  const onSubmitHandler = async ({
    varianceNote,
    ...values
  }: CloseCashDrawerForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        `${cashDrawerPath(organizationSlug)}/sessions/${sessionId}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            ...(varianceNote && { varianceNote }),
          }),
        },
      );

      enqueueSnackbar(tOrders("cashDrawer.actions.close.success"), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="close-cash-drawer-form" onSubmit={onSubmit}>
      <Alert
        severity={
          countedCash !== "" &&
          exceedsTolerance(countedCash, expectedCash, varianceTolerance)
            ? "warning"
            : "info"
        }
      >
        {tOrders("cashDrawer.varianceSummary", {
          expected: formatMoney(Number(expectedCash), currency),
          variance: variance === null ? "-" : money(variance),
        })}
      </Alert>
      <CashAmountField
        error={errors.countedCash?.message}
        label={tOrders("cashDrawer.countedCash")}
        name="countedCash"
        onChange={(value) => {
          setValue("countedCash", value);

          if (isSubmitted)
            trigger(["countedCash", "retainedFloat", "varianceNote"]);
        }}
        value={countedCash}
      />
      <CashAmountField
        error={errors.retainedFloat?.message}
        helperText={tOrders("cashDrawer.retainedFloatHint")}
        label={tOrders("cashDrawer.retainedFloat")}
        name="retainedFloat"
        onChange={(value) => {
          setValue("retainedFloat", value);

          if (isSubmitted) trigger(["countedCash", "retainedFloat"]);
        }}
        value={retainedFloat}
      />
      <TextField
        {...register("varianceNote")}
        error={!!errors.varianceNote}
        fullWidth
        helperText={
          errors.varianceNote?.message ||
          tOrders("cashDrawer.varianceNoteHint", {
            tolerance: formatMoney(Number(varianceTolerance), currency),
          })
        }
        label={tOrders("cashDrawer.varianceNote")}
        multiline
        slotProps={{ htmlInput: { maxLength: 500 } }}
      />
    </FormBox>
  );
};

export default CloseCashDrawerDialog;
