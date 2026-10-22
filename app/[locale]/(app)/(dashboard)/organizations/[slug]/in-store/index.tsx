"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { StyledCardContent } from "@/components/FormCard";

import { API_ORDER_MODE, ORDER_MODE } from "@/constants/orderMode";

import { Download } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  Chip,
  DialogContentText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  CreateOrderTicketPrinterDto,
  DineInTableTokenResponse,
  OrderModeTokenResponse,
  OrderQrSecretResponse,
} from "@/types/orders";
import type {
  InvoicePrinterSetting,
  Printer,
  PrinterCredentials,
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

interface OrderQrSecretCardProps {
  organizationSlug: string;
}

const OrderQrSecretCard = ({ organizationSlug }: OrderQrSecretCardProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tOrganizations = useTranslations("organizations");

  const { mutate: mutateTokens } = useSWRConfig();

  const secretUrl = `/api/organizations/${organizationSlug}/order-qr-secret`;

  const { data, mutate } = useSWR<OrderQrSecretResponse>(secretUrl);

  const updateSecret = async (
    action: "restore" | "rotate",
    successMessage: string,
  ) => {
    await mutate(
      fetcher<OrderQrSecretResponse>(`${secretUrl}/${action}`, {
        method: "POST",
      }),
      { revalidate: false },
    );
    await mutateTokens(
      (key) =>
        typeof key === "string" &&
        key.startsWith(`/api/organizations/${organizationSlug}/`) &&
        key.endsWith("/token"),
    );
    enqueueSnackbar(successMessage, { variant: "success" });
  };

  const handleRotate = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations("inStore.qrSecret.rotateConfirm")}
        </DialogContentText>
      ),
      onConfirm: () =>
        updateSecret(
          "rotate",
          tOrganizations("inStore.qrSecret.rotateSuccess"),
        ),
      open: true,
      title: tOrganizations("inStore.qrSecret.rotate"),
    });

  const handleRestore = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations("inStore.qrSecret.restoreConfirm")}
        </DialogContentText>
      ),
      onConfirm: () =>
        updateSecret(
          "restore",
          tOrganizations("inStore.qrSecret.restoreSuccess"),
        ),
      open: true,
      title: tOrganizations("inStore.qrSecret.restore"),
    });

  return (
    <Card variant="outlined">
      <StyledCardContent>
        <BoldTypography color="textSecondary" variant="subtitle2">
          {tOrganizations("inStore.qrSecret.label")}
        </BoldTypography>
        <Typography variant="body2">
          {tOrganizations("inStore.qrSecret.description")}
        </Typography>
        {data && (
          <>
            <Typography color="textSecondary" variant="body2">
              {tOrganizations("inStore.qrSecret.rotatedAt")}
              {": "}
              {data.rotatedAt
                ? format.dateTime(new Date(data.rotatedAt), "short")
                : tOrganizations("inStore.qrSecret.neverRotated")}
            </Typography>
            <ActionsStack direction="row">
              <Button color="error" onClick={handleRotate} variant="outlined">
                {tOrganizations("inStore.qrSecret.rotate")}
              </Button>
              {data.restorable && (
                <Button onClick={handleRestore} variant="outlined">
                  {tOrganizations("inStore.qrSecret.restore")}
                </Button>
              )}
            </ActionsStack>
          </>
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

  const [credentials, setCredentials] = useState<PrinterCredentials | null>(
    null,
  );

  const [settingUp, setSettingUp] = useState(false);

  const register = async () => {
    const registered = await fetcher<PrinterCredentials>(printerUrl, {
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

interface OrderTicketPrinterItemProps {
  credentials: PrinterCredentials | null;
  multiple: boolean;
  onChanged: () => Promise<unknown>;
  onRegistered: (credentials: PrinterCredentials) => void;
  organizationSlug: string;
  printer: Printer;
}

const OrderTicketPrinterItem = ({
  credentials,
  multiple,
  onChanged,
  onRegistered,
  organizationSlug,
  printer,
}: OrderTicketPrinterItemProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tOrganizations = useTranslations("organizations");

  const printerUrl = `/api/organizations/${organizationSlug}/order-ticket-printers/${printer.id}`;
  const name = printer.name ?? "";

  const handleReset = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations("inStore.orderTicketPrinters.resetConfirm")}
        </DialogContentText>
      ),
      onConfirm: async () =>
        onRegistered(
          await fetcher<PrinterCredentials>(`${printerUrl}/credentials`, {
            method: "PUT",
          }),
        ),
      open: true,
      title: tOrganizations("inStore.orderTicketPrinters.reset"),
    });

  const handleRemove = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tOrganizations("inStore.orderTicketPrinters.removeConfirm", {
            name,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        await fetcher(printerUrl, { method: "DELETE" });
        enqueueSnackbar(
          tOrganizations("inStore.orderTicketPrinters.removeSuccess", {
            name,
          }),
          { variant: "success" },
        );
        await onChanged();
      },
      open: true,
      title: tOrganizations("inStore.orderTicketPrinters.remove"),
    });

  const [settingDefault, setSettingDefault] = useState(false);

  const handleSetDefault = async () => {
    setSettingDefault(true);

    try {
      await fetcher<Printer>(`${printerUrl}/default`, { method: "PUT" });
      enqueueSnackbar(
        tOrganizations("inStore.orderTicketPrinters.setDefaultSuccess", {
          name,
        }),
        { variant: "success" },
      );
      await onChanged();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setSettingDefault(false);
    }
  };

  const current = credentials ?? printer;

  return (
    <CardsStack>
      <ActionsStack direction="row">
        <BoldTypography variant="body1">{name}</BoldTypography>
        {multiple && printer.isDefault && (
          <Chip
            color="primary"
            label={tOrganizations("inStore.orderTicketPrinters.default")}
            size="small"
            variant="outlined"
          />
        )}
        <Chip
          color={printer.online ? "success" : "error"}
          label={tOrganizations(
            printer.online
              ? "inStore.orderTicketPrinters.online"
              : "inStore.orderTicketPrinters.offline",
          )}
          size="small"
          variant="outlined"
        />
      </ActionsStack>
      <Stack>
        <UrlTypography variant="body2">
          {tOrganizations("inStore.orderTicketPrinters.username")}
          {": "}
          {current.username}
        </UrlTypography>
        {credentials && (
          <UrlTypography variant="body2">
            {tOrganizations("inStore.orderTicketPrinters.password")}
            {": "}
            {credentials.password}
          </UrlTypography>
        )}
        <UrlTypography variant="body2">
          {tOrganizations("inStore.orderTicketPrinters.url")}
          {": "}
          {current.url}
        </UrlTypography>
        <Typography color="textSecondary" variant="body2">
          {tOrganizations("inStore.orderTicketPrinters.lastSeenAt")}
          {": "}
          {printer.lastSeenAt
            ? format.dateTime(new Date(printer.lastSeenAt), "short")
            : tOrganizations("inStore.orderTicketPrinters.neverSeen")}
        </Typography>
        {printer.pollIntervalMs !== null && (
          <Typography color="textSecondary" variant="body2">
            {tOrganizations("inStore.orderTicketPrinters.pollInterval", {
              seconds: Math.round(printer.pollIntervalMs / 1000),
            })}
          </Typography>
        )}
      </Stack>
      {credentials && (
        <Alert severity="warning">
          {tOrganizations("inStore.orderTicketPrinters.credentialsNotice")}
        </Alert>
      )}
      <ActionsStack direction="row">
        {multiple && !printer.isDefault && (
          <Button
            loading={settingDefault}
            onClick={handleSetDefault}
            variant="outlined"
          >
            {tOrganizations("inStore.orderTicketPrinters.setDefault")}
          </Button>
        )}
        <Button onClick={handleReset} variant="outlined">
          {tOrganizations("inStore.orderTicketPrinters.reset")}
        </Button>
        <Button color="error" onClick={handleRemove} variant="outlined">
          {tOrganizations("inStore.orderTicketPrinters.remove")}
        </Button>
      </ActionsStack>
    </CardsStack>
  );
};

interface OrderTicketPrintersCardProps {
  organizationSlug: string;
}

const OrderTicketPrintersCard = ({
  organizationSlug,
}: OrderTicketPrintersCardProps) => {
  const tOrganizations = useTranslations("organizations");

  const printersUrl = `/api/organizations/${organizationSlug}/order-ticket-printers`;

  const { data: printers, mutate } = useSWR<Printer[]>(printersUrl);

  const [credentials, setCredentials] = useState<PrinterCredentials | null>(
    null,
  );

  const [name, setName] = useState("");

  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);

    try {
      const created = await fetcher<PrinterCredentials>(printersUrl, {
        body: JSON.stringify({
          name: name.trim(),
        } satisfies CreateOrderTicketPrinterDto),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      setCredentials(created);
      setName("");

      if (created.queuedCount)
        enqueueSnackbar(
          tOrganizations("inStore.orderTicketPrinters.queued", {
            count: created.queuedCount,
            name: created.name ?? "",
          }),
          { variant: "info" },
        );

      await mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setAdding(false);
    }
  };

  const handleRegistered = async (registered: PrinterCredentials) => {
    setCredentials(registered);
    await mutate();
  };

  return (
    <Card variant="outlined">
      <StyledCardContent>
        <BoldTypography color="textSecondary" variant="subtitle2">
          {tOrganizations("inStore.orderTicketPrinters.label")}
        </BoldTypography>
        <Typography variant="body2">
          {tOrganizations("inStore.orderTicketPrinters.description")}
        </Typography>
        {printers &&
          (printers.length ? (
            <>
              <Alert severity="info">
                {tOrganizations("inStore.orderTicketPrinters.steps")}
              </Alert>
              {printers.map((printer) => (
                <OrderTicketPrinterItem
                  credentials={
                    credentials?.id === printer.id ? credentials : null
                  }
                  key={printer.id}
                  multiple={printers.length > 1}
                  onChanged={mutate}
                  onRegistered={handleRegistered}
                  organizationSlug={organizationSlug}
                  printer={printer}
                />
              ))}
            </>
          ) : (
            <Typography color="textSecondary" variant="body2">
              {tOrganizations("inStore.orderTicketPrinters.empty")}
            </Typography>
          ))}
        {printers && (
          <ActionsStack direction="row">
            <TextField
              label={tOrganizations("inStore.orderTicketPrinters.name.label")}
              onChange={(event) => setName(event.target.value)}
              placeholder={tOrganizations(
                "inStore.orderTicketPrinters.name.placeholder",
              )}
              size="small"
              slotProps={{ htmlInput: { maxLength: 50 } }}
              value={name}
            />
            <Button
              disabled={!name.trim()}
              loading={adding}
              onClick={handleAdd}
              variant="outlined"
            >
              {tOrganizations("inStore.orderTicketPrinters.add")}
            </Button>
          </ActionsStack>
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
      <OrderQrSecretCard organizationSlug={organizationSlug} />
      <InvoicePrinterCard organizationSlug={organizationSlug} />
      <OrderTicketPrintersCard organizationSlug={organizationSlug} />
    </CardsStack>
  );
};

export default OrganizationsSlugInStore;
