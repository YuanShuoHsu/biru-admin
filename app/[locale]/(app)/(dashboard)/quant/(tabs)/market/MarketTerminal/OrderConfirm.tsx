"use client";

import { useTranslations } from "next-intl";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";

import { DialogContentText, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const Rows = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const Row = styled(Stack)({
  flexDirection: "row",
  justifyContent: "space-between",
});

interface OrderConfirmProps {
  rows: { label: string; value: string }[];
}

const OrderConfirm = ({ rows }: OrderConfirmProps) => {
  const tQuant = useTranslations("quant");

  return (
    <>
      <CustomizedDialogContent>
        <StyledStack>
          <DialogContentText>
            {tQuant("order.confirm.message")}
          </DialogContentText>
          <Rows>
            {rows.map(({ label, value }) => (
              <Row key={label}>
                <Typography color="textSecondary" variant="body2">
                  {label}
                </Typography>
                <Typography variant="body2">{value}</Typography>
              </Row>
            ))}
          </Rows>
        </StyledStack>
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default OrderConfirm;
