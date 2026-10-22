"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";
import useSWR from "swr";

import { StyledCardContent } from "@/components/FormCard";

import { API_ORDER_MODE, ORDER_MODE } from "@/constants/orderMode";

import { Download } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  DialogContentText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  DineInTableTokenResponse,
  OrderModeTokenResponse,
} from "@/types/orders";
import type {
  InvoicePrinterCredentials,
  InvoicePrinterSetting,
} from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

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

const CardsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

interface OrderQrCodeProps {
  fileName: string;
  orderUrl: string;
}

const OrderQrCode = ({ fileName, orderUrl }: OrderQrCodeProps) => {
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const tOrganizations = useTranslations("organizations");

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = qrCodeRef.current?.toDataURL("image/png") || "";
    link.click();
  };

  return (
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
          {tOrganizations("inStore.download")}
        </Button>
      </ActionsStack>
    </>
  );
};

interface DineInQrCodeCardProps {
  organizationSlug: string;
}

const DineInQrCodeCard = ({ organizationSlug }: DineInQrCodeCardProps) => {
  const [tableNumber, setTableNumber] = useState("");

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

  return (
    <Card variant="outlined">
      <StyledCardContent>
        <BoldTypography color="textSecondary" variant="subtitle2">
          {tOrganizations("inStore.dineIn.label")}
        </BoldTypography>
        <TextField
          error={!!tableNumber && !isValidTableNumber}
          helperText={tOrganizations("inStore.dineIn.tableNumber.helperText")}
          label={tOrganizations("inStore.dineIn.tableNumber.label")}
          onChange={(event) => setTableNumber(event.target.value)}
          placeholder={tOrganizations("inStore.dineIn.tableNumber.placeholder")}
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
          value={tableNumber}
        />
        {orderUrl && (
          <OrderQrCode
            fileName={`table-${tableNumber}-${organizationSlug}.png`}
            orderUrl={orderUrl}
          />
        )}
      </StyledCardContent>
    </Card>
  );
};

interface OrderModeQrCodeCardProps {
  label: string;
  mode: typeof ORDER_MODE.Counter | typeof ORDER_MODE.DriveThru;
  organizationSlug: string;
}

const OrderModeQrCodeCard = ({
  label,
  mode,
  organizationSlug,
}: OrderModeQrCodeCardProps) => {
  const apiMode = API_ORDER_MODE[mode];

  const { data } = useSWR<OrderModeTokenResponse>(
    `/api/organizations/${organizationSlug}/order-modes/${apiMode}/token`,
  );

  const orderUrl =
    data &&
    `${process.env.NEXT_PUBLIC_NEXT_URL}/order/${mode}/${organizationSlug}?${new URLSearchParams({ modeToken: data.token })}`;

  return (
    <Card variant="outlined">
      <StyledCardContent>
        <BoldTypography color="textSecondary" variant="subtitle2">
          {label}
        </BoldTypography>
        {orderUrl && (
          <OrderQrCode
            fileName={`${mode}-${organizationSlug}.png`}
            orderUrl={orderUrl}
          />
        )}
      </StyledCardContent>
    </Card>
  );
};

interface InvoicePrinterCardProps {
  organizationSlug: string;
}

const InvoicePrinterCard = ({ organizationSlug }: InvoicePrinterCardProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tOrganizations = useTranslations("organizations");

  const printerUrl = `/api/organizations/${organizationSlug}/invoice-printer`;

  const { data, mutate } = useSWR<InvoicePrinterSetting>(printerUrl);

  const [credentials, setCredentials] =
    useState<InvoicePrinterCredentials | null>(null);

  const [settingUp, setSettingUp] = useState(false);

  const register = async () => {
    const registered = await fetcher<InvoicePrinterCredentials>(printerUrl, {
      method: "PUT",
    });

    setCredentials(registered);

    if (registered.queuedCount)
      enqueueSnackbar(
        tOrganizations("inStore.invoicePrinter.queued", {
          count: registered.queuedCount,
        }),
        { variant: "info" },
      );

    await mutate();
  };

  const handleSetup = async () => {
    setSettingUp(true);

    try {
      await register();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setSettingUp(false);
    }
  };

  const handleReset = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations("inStore.invoicePrinter.resetConfirm")}
        </DialogContentText>
      ),
      onConfirm: register,
      open: true,
      title: tOrganizations("inStore.invoicePrinter.reset"),
    });

  const handleRemove = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations("inStore.invoicePrinter.removeConfirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        await fetcher(printerUrl, { method: "DELETE" });
        setCredentials(null);
        enqueueSnackbar(
          tOrganizations("inStore.invoicePrinter.removeSuccess"),
          {
            variant: "success",
          },
        );
        await mutate();
      },
      open: true,
      title: tOrganizations("inStore.invoicePrinter.remove"),
    });

  const printer = credentials ?? data?.printer;

  return (
    <Card variant="outlined">
      <StyledCardContent>
        <BoldTypography color="textSecondary" variant="subtitle2">
          {tOrganizations("inStore.invoicePrinter.label")}
        </BoldTypography>
        <Typography variant="body2">
          {tOrganizations("inStore.invoicePrinter.description")}
        </Typography>
        {printer ? (
          <>
            <Alert severity="info">
              {tOrganizations("inStore.invoicePrinter.steps")}
            </Alert>
            <Stack>
              <UrlTypography variant="body2">
                {tOrganizations("inStore.invoicePrinter.username")}
                {": "}
                {printer.username}
              </UrlTypography>
              {credentials && (
                <UrlTypography variant="body2">
                  {tOrganizations("inStore.invoicePrinter.password")}
                  {": "}
                  {credentials.password}
                </UrlTypography>
              )}
              <UrlTypography variant="body2">
                {tOrganizations("inStore.invoicePrinter.url")}
                {": "}
                {printer.url}
              </UrlTypography>
              <Typography color="textSecondary" variant="body2">
                {tOrganizations("inStore.invoicePrinter.lastSeenAt")}
                {": "}
                {printer.lastSeenAt
                  ? format.dateTime(new Date(printer.lastSeenAt), "short")
                  : tOrganizations("inStore.invoicePrinter.neverSeen")}
              </Typography>
              {printer.pollIntervalMs !== null && (
                <Typography color="textSecondary" variant="body2">
                  {tOrganizations("inStore.invoicePrinter.pollInterval", {
                    seconds: Math.round(printer.pollIntervalMs / 1000),
                  })}
                </Typography>
              )}
            </Stack>
            {credentials && (
              <Alert severity="warning">
                {tOrganizations("inStore.invoicePrinter.credentialsNotice")}
              </Alert>
            )}
            <ActionsStack direction="row">
              <Button onClick={handleReset} variant="outlined">
                {tOrganizations("inStore.invoicePrinter.reset")}
              </Button>
              <Button color="error" onClick={handleRemove} variant="outlined">
                {tOrganizations("inStore.invoicePrinter.remove")}
              </Button>
            </ActionsStack>
          </>
        ) : (
          data && (
            <ActionsStack direction="row">
              <Button
                loading={settingUp}
                onClick={handleSetup}
                variant="outlined"
              >
                {tOrganizations("inStore.invoicePrinter.setup")}
              </Button>
            </ActionsStack>
          )
        )}
      </StyledCardContent>
    </Card>
  );
};

interface OrganizationsSlugInStoreProps {
  organizationSlug: string;
}

const OrganizationsSlugInStore = ({
  organizationSlug,
}: OrganizationsSlugInStoreProps) => {
  const tOrganizations = useTranslations("organizations");

  return (
    <CardsStack>
      <DineInQrCodeCard organizationSlug={organizationSlug} />
      <OrderModeQrCodeCard
        label={tOrganizations("inStore.counter.label")}
        mode={ORDER_MODE.Counter}
        organizationSlug={organizationSlug}
      />
      <OrderModeQrCodeCard
        label={tOrganizations("inStore.driveThru.label")}
        mode={ORDER_MODE.DriveThru}
        organizationSlug={organizationSlug}
      />
      <InvoicePrinterCard organizationSlug={organizationSlug} />
    </CardsStack>
  );
};

export default OrganizationsSlugInStore;
