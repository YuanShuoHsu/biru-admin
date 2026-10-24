"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import CashAmountField from "../CashAmountField";
import {
  type CashDrawerMovementForm,
  useCashDrawerMovementFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { cashDrawerMovementTypeValues } from "@/types/api";
import type { CashDrawerMovementType } from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { cashDrawerPath } from "@/utils/orders";

interface CashDrawerMovementDialogProps {
  currency: string | null | undefined;
  mutate: () => void;
  organizationSlug: string;
  sessionId: string;
}

const CashDrawerMovementDialog = ({
  currency,
  mutate,
  organizationSlug,
  sessionId,
}: CashDrawerMovementDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const formatMoney = useFormatMoney();

  const tOrders = useTranslations("orders");

  const cashDrawerMovementFormSchema = useCashDrawerMovementFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<CashDrawerMovementForm>({
    defaultValues: { amount: "", reason: "", type: "payIn" },
    resolver: zodResolver(cashDrawerMovementFormSchema),
  });

  const [amount, type] = useWatch({ control, name: ["amount", "type"] });

  const onSubmitHandler = async (values: CashDrawerMovementForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        `${cashDrawerPath(organizationSlug)}/sessions/${sessionId}/movements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      enqueueSnackbar(
        tOrders("cashDrawer.actions.movement.success", {
          amount: formatMoney(Number(values.amount), currency),
          type: tOrders(`cashDrawer.movementType.${values.type}`),
        }),
        { variant: "success" },
      );

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
    <FormBox id="cash-drawer-movement-form" onSubmit={onSubmit}>
      <ToggleButtonGroup
        exclusive
        fullWidth
        onChange={(_, value: CashDrawerMovementType | null) => {
          if (value) setValue("type", value);
        }}
        size="small"
        value={type}
      >
        {cashDrawerMovementTypeValues.map((value) => (
          <ToggleButton key={value} value={value}>
            {tOrders(`cashDrawer.movementType.${value}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <CashAmountField
        error={errors.amount?.message}
        label={tOrders("cashDrawer.amount")}
        name="amount"
        onChange={(value) =>
          setValue("amount", value, { shouldValidate: isSubmitted })
        }
        value={amount}
      />
      <TextField
        {...register("reason")}
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tOrders("cashDrawer.reason")}
        placeholder={tOrders("cashDrawer.reasonPlaceholder")}
        required
        slotProps={{ htmlInput: { maxLength: 200 } }}
      />
    </FormBox>
  );
};

export default CashDrawerMovementDialog;
