"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useMemo, useState } from "react";
import { type FieldError, get, useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import {
  getSelectedQuantities,
  type RefundOrderForm,
  useRefundOrderFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  Divider,
  FormControl,
  FormHelperText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { refundReasonCodeValues } from "@/types/api";
import type {
  AdminOrderResponse,
  CreateOrderRefundDto,
  OrderRefund,
  OrderRefundPreview,
  PreviewOrderRefundDto,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { type FetchError, fetcher, sendRequest } from "@/utils/fetcher";
import { getRefundedQuantities } from "@/utils/refunds";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useOrderItemName } from "@/hooks/useOrderItemName";

const ItemsFormControl = styled(FormControl)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const ItemRowStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
  justifyContent: "space-between",
}));

const StyledTextField = styled(TextField)({
  minWidth: 88,
});

const SummaryRowStack = styled(Stack)({
  justifyContent: "space-between",
});

const TotalStack = styled(Stack)({
  alignItems: "center",
  justifyContent: "space-between",
});

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

export const REFUND_ORDER_FORM_ID = "refund-order-form";

interface RefundOrderDialogContentProps {
  mutate: () => void;
  order: AdminOrderResponse;
  organizationSlug: string;
}

const RefundOrderDialogContent = ({
  mutate,
  order,
  organizationSlug,
}: RefundOrderDialogContentProps) => {
  const { closeDialog, confirmLoading, setDialog } = useDialogStore(
    (state) => state,
  );

  const formatMoney = useFormatMoney();

  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");

  const getOrderItemName = useOrderItemName();

  const refundsKey = `/api/organizations/${organizationSlug}/orders/${order.id}/refunds`;

  const {
    data: refunds,
    error,
    isLoading,
    mutate: mutateRefunds,
  } = useSWR<OrderRefund[]>(refundsKey, fetcher);

  const refundedQuantities = useMemo(
    () => getRefundedQuantities(refunds),
    [refunds],
  );

  const remaining = useMemo(
    () =>
      new Map(
        order.items.map((item) => [
          item.id,
          item.orderQuantity - (refundedQuantities.get(item.id) ?? 0),
        ]),
      ),
    [order.items, refundedQuantities],
  );

  const refundOrderFormSchema = useRefundOrderFormSchema(remaining);

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<RefundOrderForm>({
    defaultValues: { quantities: {}, reason: "", reasonCode: "" },
    resolver: zodResolver(refundOrderFormSchema),
  });

  const [quantities, reasonCode] = useWatch({
    control,
    name: ["quantities", "reasonCode"],
  });

  const [failed, setFailed] = useState(false);

  const quantitiesError = get(errors, "quantities") as FieldError | undefined;

  const selected = getSelectedQuantities(quantities, remaining);

  const items = [...selected]
    .filter(([, quantity]) => quantity > 0)
    .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

  const { data: preview, error: previewError } = useSWR<OrderRefundPreview>(
    items.length ? [`${refundsKey}/preview`, items] : null,
    ([url, body]: [string, PreviewOrderRefundDto["items"]]) =>
      sendRequest<OrderRefundPreview, PreviewOrderRefundDto>()(url, {
        arg: { items: body },
      }),
  );

  const isEcpayRefund = order.refundChannel === "ecpay";
  const currency = order.items[0]?.priceCurrency;

  const onSubmitHandler = async ({ reason, reasonCode }: RefundOrderForm) => {
    if (!preview || isLoading || !!error || failed || !reasonCode) return;

    setDialog({ confirmLoading: true });

    try {
      const created = await fetcher<OrderRefund>(refundsKey, {
        body: JSON.stringify({
          ...(preview.isFull ? {} : { items }),
          reasonCode,
          ...(reason ? { reason } : {}),
        } satisfies CreateOrderRefundDto),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      enqueueSnackbar(
        tOrders("actions.refund.success", {
          amount: formatMoney(Number(created.amount), currency),
          orderNumber: order.orderNumber,
        }),
        { variant: "success" },
      );

      if (created.invoiceAction === "failed")
        enqueueSnackbar(
          created.invoiceError
            ? tOrders("actions.refund.invoiceFailedWithReason", {
                reason: created.invoiceError,
              })
            : tOrders("actions.refund.invoiceFailed"),
          { persist: true, variant: "warning" },
        );

      closeDialog();
    } catch (submitError) {
      const isUnconfirmed = (submitError as FetchError).status === 503;

      enqueueSnackbar(getErrorMessage(submitError), {
        persist: isUnconfirmed,
        variant: isUnconfirmed ? "warning" : "error",
      });

      setFailed(true);

      if (isUnconfirmed) closeDialog();
    } finally {
      setDialog({ confirmLoading: false });
      await mutateRefunds();
      mutate();
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id={REFUND_ORDER_FORM_ID} onSubmit={onSubmit}>
      {!!error && (
        <Alert severity="error">{tOrders("actions.refund.loadFailed")}</Alert>
      )}
      {!!previewError && (
        <Alert severity="error">
          {tOrders("actions.refund.previewFailedWithReason", {
            reason: getErrorMessage(previewError),
          })}
        </Alert>
      )}
      {failed && (
        <Alert severity="warning">
          {tOrders("actions.refund.retryBlocked")}
        </Alert>
      )}
      {!isEcpayRefund && (
        <Alert severity="warning">
          {tOrders("actions.refund.manualChannel")}
        </Alert>
      )}
      {preview?.isFull && order.invoice?.status === "issued" && (
        <Alert severity="info">{tOrders("actions.refund.invoiceHint")}</Alert>
      )}
      <ItemsFormControl error={!!quantitiesError}>
        <Typography variant="body2">
          {tOrders("actions.refund.itemsLabel")}
        </Typography>
        {order.items.map((item) => {
          const itemRemaining = remaining.get(item.id) ?? 0;

          return (
            <ItemRowStack direction="row" key={item.id}>
              <Typography
                color={itemRemaining ? "textPrimary" : "textDisabled"}
                variant="body2"
              >
                {getOrderItemName(item)} {tCommon("multiply")} {itemRemaining}
              </Typography>
              <StyledTextField
                disabled={!itemRemaining || confirmLoading}
                onChange={({ target }) => {
                  setFailed(false);
                  setValue(
                    "quantities",
                    Object.fromEntries(
                      new Map(selected).set(item.id, Number(target.value)),
                    ),
                    { shouldValidate: isSubmitted },
                  );
                }}
                select
                size="small"
                slotProps={{
                  htmlInput: { "aria-label": getOrderItemName(item) },
                }}
                value={Math.min(selected.get(item.id) ?? 0, itemRemaining)}
              >
                {Array.from({ length: itemRemaining + 1 }, (_, index) => (
                  <MenuItem key={index} value={index}>
                    {index}
                  </MenuItem>
                ))}
              </StyledTextField>
            </ItemRowStack>
          );
        })}
        {quantitiesError && (
          <FormHelperText>{quantitiesError.message}</FormHelperText>
        )}
      </ItemsFormControl>
      <TextField
        disabled={confirmLoading}
        error={!!errors.reasonCode}
        helperText={errors.reasonCode?.message}
        label={tOrders("actions.refund.reasonCode")}
        required
        select
        size="small"
        value={reasonCode}
        {...register("reasonCode")}
      >
        {refundReasonCodeValues.map((code) => (
          <MenuItem key={code} value={code}>
            {tOrders(`detail.refunds.reasonCode.${code}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        disabled={confirmLoading}
        error={!!errors.reason}
        helperText={errors.reason?.message}
        label={tOrders("actions.refund.reason")}
        required={reasonCode === "other"}
        size="small"
        slotProps={{ htmlInput: { maxLength: 50 } }}
        {...register("reason")}
      />
      <Divider />
      {!!preview?.allocatedDiscount && (
        <SummaryRowStack direction="row">
          <Typography variant="body2">
            {tOrders("actions.refund.allocatedDiscount")}
          </Typography>
          <Typography variant="body2">
            -{formatMoney(preview.allocatedDiscount, currency)}
          </Typography>
        </SummaryRowStack>
      )}
      <TotalStack direction="row">
        <StyledTypography variant="subtitle1">
          {tOrders("actions.refund.amount")}
        </StyledTypography>
        <StyledTypography color="error" variant="h6">
          {formatMoney(preview?.amount ?? 0, currency)}
        </StyledTypography>
      </TotalStack>
    </FormBox>
  );
};

export default RefundOrderDialogContent;
