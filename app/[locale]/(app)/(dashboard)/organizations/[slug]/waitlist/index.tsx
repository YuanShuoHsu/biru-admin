"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import UpdateWaitlistDialog from "./UpdateWaitlistDialog";

import DetailsCard from "@/components/DetailsCard";

import { Link as MuiLink, Typography } from "@mui/material";

import { Link } from "@/i18n/navigation";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { WaitlistSettingsResponse } from "@/types/waitlist";

interface OrganizationsSlugWaitlistProps {
  canUpdateOrganization: boolean;
  canUpdateWaitlist: boolean;
  organizationName: string;
  organizationSlug: string;
  settings: WaitlistSettingsResponse;
}

const OrganizationsSlugWaitlist = ({
  canUpdateOrganization,
  canUpdateWaitlist,
  organizationName,
  organizationSlug,
  settings: initialSettings,
}: OrganizationsSlugWaitlistProps) => {
  const [settings, setSettings] = useState(initialSettings);

  const { setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tOrganizations = useTranslations("organizations");
  const tWaitlist = useTranslations("waitlist");

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
      {settings.enabled && canUpdateOrganization && (
        <Typography color="textSecondary" variant="body2">
          {tOrganizations.rich("waitlist.entranceQrCode", {
            link: (chunks) => (
              <MuiLink
                component={Link}
                href={`/organizations/${organizationSlug}/in-store`}
              >
                {chunks}
              </MuiLink>
            ),
          })}
        </Typography>
      )}
    </>
  );
};

export default OrganizationsSlugWaitlist;
