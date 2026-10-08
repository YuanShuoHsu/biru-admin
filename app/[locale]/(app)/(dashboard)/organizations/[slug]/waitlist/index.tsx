"use client";

import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";

import UpdateWaitlistDialog from "./UpdateWaitlistDialog";

import DetailsCard from "@/components/DetailsCard";
import { StyledCardContent } from "@/components/FormCard";

import { Download } from "@mui/icons-material";
import { Button, Card, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { WaitlistSettingsResponse } from "@/types/waitlist";

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

interface OrganizationsSlugWaitlistProps {
  canUpdateWaitlist: boolean;
  organizationName: string;
  organizationSlug: string;
  settings: WaitlistSettingsResponse;
}

const OrganizationsSlugWaitlist = ({
  canUpdateWaitlist,
  organizationName,
  organizationSlug,
  settings: initialSettings,
}: OrganizationsSlugWaitlistProps) => {
  const [settings, setSettings] = useState(initialSettings);

  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const { setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tOrganizations = useTranslations("organizations");
  const tWaitlist = useTranslations("waitlist");

  const waitlistUrl = `${process.env.NEXT_PUBLIC_NEXT_URL}/waitlist/${organizationSlug}`;

  const handleUpdateWaitlist = () => {
    setDialog({
      content: (
        <UpdateWaitlistDialog
          onSaved={setSettings}
          organizationName={organizationName}
          organizationSlug={organizationSlug}
          settings={settings}
        />
      ),
      formId: "update-waitlist-form",
      open: true,
      title: tOrganizations("waitlist.actions.updateWaitlist.title"),
    });
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = `waitlist-${organizationSlug}.png`;
    link.href = qrCodeRef.current?.toDataURL("image/png") || "";
    link.click();
  };

  const items = [
    {
      key: "enabled",
      label: tOrganizations("waitlist.enabled.label"),
      value: tOrganizations(
        settings.enabled ? "waitlist.enabled.on" : "waitlist.enabled.off",
      ),
    },
    {
      key: "groups",
      label: tOrganizations("waitlist.groups.label"),
      value: settings.groups
        .map(({ maxPartySize, minPartySize, prefix }) =>
          tOrganizations("waitlist.groups.value", {
            prefix,
            range:
              minPartySize === maxPartySize
                ? tWaitlist("single", { count: minPartySize })
                : tWaitlist("range", { max: maxPartySize, min: minPartySize }),
          }),
        )
        .join(tCommon("delimiter")),
    },
    {
      key: "cutoffMinutes",
      label: tOrganizations("waitlist.cutoffMinutes.label"),
      value: tOrganizations("waitlist.cutoffMinutes.value", {
        value: settings.cutoffMinutes,
      }),
    },
    {
      key: "graceMinutes",
      label: tOrganizations("waitlist.graceMinutes.label"),
      value: tOrganizations("waitlist.graceMinutes.value", {
        value: settings.graceMinutes,
      }),
    },
    {
      key: "holdMinutes",
      label: tOrganizations("waitlist.holdMinutes.label"),
      value: tOrganizations("waitlist.holdMinutes.value", {
        value: settings.holdMinutes,
      }),
    },
  ];

  return (
    <>
      <DetailsCard
        action={
          canUpdateWaitlist
            ? {
                label: tOrganizations("waitlist.actions.updateWaitlist.title"),
                onClick: handleUpdateWaitlist,
              }
            : undefined
        }
        items={items}
      />
      {settings.enabled && (
        <Card variant="outlined">
          <StyledCardContent>
            <BoldTypography color="textSecondary" variant="subtitle2">
              {tOrganizations("waitlist.qrCode.label")}
            </BoldTypography>
            <QRCodeCanvas
              marginSize={2}
              ref={qrCodeRef}
              size={QR_CODE_DOWNLOAD_SIZE}
              style={{
                height: QR_CODE_DISPLAY_SIZE,
                width: QR_CODE_DISPLAY_SIZE,
              }}
              value={waitlistUrl}
            />
            <UrlTypography variant="body2">{waitlistUrl}</UrlTypography>
            <Typography color="textSecondary" variant="body2">
              {tOrganizations("waitlist.qrCode.helperText")}
            </Typography>
            <ActionsStack direction="row">
              <Button
                onClick={handleDownload}
                startIcon={<Download />}
                variant="outlined"
              >
                {tOrganizations("waitlist.qrCode.download")}
              </Button>
            </ActionsStack>
          </StyledCardContent>
        </Card>
      )}
    </>
  );
};

export default OrganizationsSlugWaitlist;
