// https://mui.com/material-ui/react-toggle-button/#CustomizedDividers.tsx
// https://mui.com/material-ui/react-toggle-button/#VerticalSpacingToggleButton.tsx
// https://mui.com/material-ui/react-radio-button/#RadioButtons.tsx

import { useParams } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";

import {
  CreditCard,
  MarkChatRead,
  Payments,
  QrCodeScanner,
} from "@mui/icons-material";
import {
  Paper,
  Radio,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { OrderMode } from "@/types/orderMode";
import type { PaymentMethod } from "@/types/payment";
import type { RouteParams } from "@/types/routeParams";

const paymentOptions = (mode: OrderMode) => [
  ...(mode === ORDER_MODE.DineIn
    ? [
        {
          id: "Cash",
          icon: Payments,
          label: "現金",
        },
      ]
    : []),
  {
    id: "Credit",
    icon: CreditCard,
    label: "信用卡",
  },
  {
    id: "TWQR",
    icon: QrCodeScanner,
    label: "行動支付",
  },
  {
    id: "WeiXin",
    icon: MarkChatRead,
    label: "微信支付",
  },
];

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid rgba(${theme.vars.palette.common.onBackgroundChannel} / 0.23)`,
}));

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
  const { mode } = useParams<RouteParams>();

  const handlePaymentChange = (
    _: React.MouseEvent<HTMLElement>,
    newPayment: PaymentMethod | null,
  ) => setPayment(newPayment);

  return (
    <StyledPaper elevation={0}>
      <StyledToggleButtonGroup
        aria-label="payment method selection"
        exclusive
        onChange={handlePaymentChange}
        orientation="vertical"
        value={payment}
        size="small"
      >
        {paymentOptions(mode).map(({ id, icon: Icon, label }) => (
          <StyledToggleButton aria-label={label} key={id} value={id}>
            <Stack
              display="flex"
              flexDirection="row"
              alignItems="center"
              gap={2}
            >
              <Icon />
              <Typography>{label}</Typography>
            </Stack>
            <StyledRadio
              aria-label={label}
              key={id}
              checked={payment === id}
              name="radio-buttons"
              size="small"
              value={id}
            />
          </StyledToggleButton>
        ))}
      </StyledToggleButtonGroup>
    </StyledPaper>
  );
};

export default VerticalSpacingToggleButton;
