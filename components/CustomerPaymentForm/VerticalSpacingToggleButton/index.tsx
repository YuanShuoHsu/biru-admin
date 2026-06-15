// https://mui.com/material-ui/react-toggle-button/#CustomizedDividers.tsx
// https://mui.com/material-ui/react-toggle-button/#VerticalSpacingToggleButton.tsx
// https://mui.com/material-ui/react-radio-button/#RadioButtons.tsx

"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";

import {
  CreditCard,
  MarkChatRead,
  Payments,
  QrCodeScanner,
} from "@mui/icons-material";
import {
  Radio,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { PaymentMethod } from "@/types/payment";
import type { RouteParams } from "@/types/routeParams";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  width: "100%",
  gap: theme.spacing(2),

  [`& .${toggleButtonGroupClasses.firstButton}, & .${toggleButtonGroupClasses.middleButton}`]:
    {
      borderColor: `rgba(${theme.vars.palette.common.onBackgroundChannel} / 0.23)`,
      borderBottomRightRadius: theme.shape.borderRadius,
      borderBottomLeftRadius: theme.shape.borderRadius,
    },
  [`& .${toggleButtonGroupClasses.lastButton}, & .${toggleButtonGroupClasses.middleButton}`]:
    {
      borderColor: `rgba(${theme.vars.palette.common.onBackgroundChannel} / 0.23)`,
      borderTopRightRadius: theme.shape.borderRadius,
      borderTopLeftRadius: theme.shape.borderRadius,
      borderTop: `1px solid rgba(${theme.vars.palette.common.onBackgroundChannel} / 0.23)`,
    },
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  paddingInline: theme.spacing(2),
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(2),

  "&.Mui-selected": {
    borderColor: theme.vars.palette.primary.main,
  },
}));

const StyledRadio = styled(Radio)({
  pointerEvents: "none",
});

interface VerticalSpacingToggleButtonProps {
  payment: PaymentMethod | null;
  setPayment: React.Dispatch<React.SetStateAction<PaymentMethod | null>>;
}

const VerticalSpacingToggleButton = ({
  payment,
  setPayment,
}: VerticalSpacingToggleButtonProps) => {
  const { mode } = useParams<Partial<RouteParams>>();
  const tOrder = useTranslations("order");

  const paymentOptions = [
    ...(mode === ORDER_MODE.DineIn
      ? [{ id: "Cash", icon: Payments, label: tOrder("checkout.payment.Cash") }]
      : []),
    {
      id: "Credit",
      icon: CreditCard,
      label: tOrder("checkout.payment.Credit"),
    },
    { id: "TWQR", icon: QrCodeScanner, label: tOrder("checkout.payment.TWQR") },
    {
      id: "WeiXin",
      icon: MarkChatRead,
      label: tOrder("checkout.payment.WeiXin"),
    },
  ];

  const handlePaymentChange = (
    _: React.MouseEvent<HTMLElement>,
    newPayment: PaymentMethod | null,
  ) => setPayment(newPayment);

  return (
    <StyledToggleButtonGroup
      aria-label="payment method selection"
      exclusive
      onChange={handlePaymentChange}
      orientation="vertical"
      size="small"
      value={payment}
    >
      {paymentOptions.map(({ id, icon: Icon, label }) => (
        <StyledToggleButton aria-label={label} key={id} value={id}>
          <Stack flexDirection="row" alignItems="center" gap={2}>
            <Icon />
            <Typography>{label}</Typography>
          </Stack>
          <StyledRadio
            aria-label={label}
            checked={payment === id}
            name="radio-buttons"
            size="small"
            value={id}
          />
        </StyledToggleButton>
      ))}
    </StyledToggleButtonGroup>
  );
};

export default VerticalSpacingToggleButton;
