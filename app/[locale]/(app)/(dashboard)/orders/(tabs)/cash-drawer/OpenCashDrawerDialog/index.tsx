"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import CashAmountField from "../CashAmountField";
import {
  type OpenCashDrawerForm,
  useOpenCashDrawerFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { cashDrawerPath } from "@/utils/orders";

interface OpenCashDrawerDialogProps {
  mutate: () => void;
  organizationSlug: string;
  suggestedOpeningFloat: string;
}

const OpenCashDrawerDialog = ({
  mutate,
  organizationSlug,
  suggestedOpeningFloat,
}: OpenCashDrawerDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tOrders = useTranslations("orders");

  const openCashDrawerFormSchema = useOpenCashDrawerFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<OpenCashDrawerForm>({
    defaultValues: { openingFloat: String(Number(suggestedOpeningFloat)) },
    resolver: zodResolver(openCashDrawerFormSchema),
  });

  const openingFloat = useWatch({ control, name: "openingFloat" });

  const onSubmitHandler = async (values: OpenCashDrawerForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`${cashDrawerPath(organizationSlug)}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      enqueueSnackbar(tOrders("cashDrawer.actions.open.success"), {
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
    <FormBox id="open-cash-drawer-form" onSubmit={onSubmit}>
      <CashAmountField
        error={errors.openingFloat?.message}
        helperText={tOrders("cashDrawer.openingFloatHint")}
        label={tOrders("cashDrawer.openingFloat")}
        name="openingFloat"
        onChange={(value) =>
          setValue("openingFloat", value, { shouldValidate: isSubmitted })
        }
        value={openingFloat}
      />
    </FormBox>
  );
};

export default OpenCashDrawerDialog;
