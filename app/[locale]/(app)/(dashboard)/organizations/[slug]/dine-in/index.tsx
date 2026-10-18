"use client";

import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";
import useSWR from "swr";

import { StyledCardContent } from "@/components/FormCard";

import { ORDER_MODE } from "@/constants/orderMode";

import { Download } from "@mui/icons-material";
import { Button, Card, Stack, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { DineInTableTokenResponse } from "@/types/orders";

const QR_CODE_DISPLAY_SIZE = 240;
const QR_CODE_DOWNLOAD_SIZE = 1024;

const BoldTypography = styled(Typography)({
  fontWeight: "bold",
});

const UrlTypography = styled(Typography)({
  wordBreak: "break-all",
});

const ActionsStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  gap: theme.spacing(1),
}));

interface OrganizationsSlugDineInProps {
  organizationSlug: string;
}

const OrganizationsSlugDineIn = ({
  organizationSlug,
}: OrganizationsSlugDineInProps) => {
  const [tableNumber, setTableNumber] = useState("");

  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const tOrganizations = useTranslations("organizations");

  const isValidTableNumber = /^[1-9]\d*$/.test(tableNumber);

  const { data } = useSWR<DineInTableTokenResponse>(
    isValidTableNumber
      ? `/api/organizations/${organizationSlug}/dine-in-tables/${tableNumber}/token`
      : null,
  );

  const orderUrl =
    data &&
    `${process.env.NEXT_PUBLIC_NEXT_URL}/order/${ORDER_MODE.DineIn}/${organizationSlug}?${new URLSearchParams({ tableNumber, tableToken: data.token })}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = `table-${tableNumber}-${organizationSlug}.png`;
    link.href = qrCodeRef.current?.toDataURL("image/png") || "";
    link.click();
  };

  return (
    <Card variant="outlined">
      <StyledCardContent>
        <BoldTypography color="textSecondary" variant="subtitle2">
          {tOrganizations("dineIn.qrCode.label")}
        </BoldTypography>
        <TextField
          error={!!tableNumber && !isValidTableNumber}
          helperText={tOrganizations("dineIn.tableNumber.helperText")}
          label={tOrganizations("dineIn.tableNumber.label")}
          onChange={(event) => setTableNumber(event.target.value)}
          placeholder={tOrganizations("dineIn.tableNumber.placeholder")}
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
          value={tableNumber}
        />
        {orderUrl && (
          <>
            <QRCodeCanvas
              marginSize={2}
              ref={qrCodeRef}
              size={QR_CODE_DOWNLOAD_SIZE}
              style={{
                height: QR_CODE_DISPLAY_SIZE,
                width: QR_CODE_DISPLAY_SIZE,
              }}
              value={orderUrl}
            />
            <UrlTypography variant="body2">{orderUrl}</UrlTypography>
            <ActionsStack direction="row">
              <Button
                onClick={handleDownload}
                startIcon={<Download />}
                variant="outlined"
              >
                {tOrganizations("dineIn.qrCode.download")}
              </Button>
            </ActionsStack>
          </>
        )}
      </StyledCardContent>
    </Card>
  );
};

export default OrganizationsSlugDineIn;
