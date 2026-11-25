"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";

import { useOrganization } from "@/hooks/organizations";
import { useSocketConnection } from "@/hooks/useSocketConnection";

import { emitMenuWithAck, menuSocket } from "@/app/socket";

import { Add } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

import WaitlistTicketDialog, {
  WAITLIST_TICKET_FORM_ID,
} from "../WaitlistTicketDialog";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminWaitlistResponse } from "@/types/waitlist";

import { getErrorMessage } from "@/utils/errors";

const HeaderStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

const WaitlistControls = () => {
  const { setDialog } = useDialogStore((state) => state);

  const organizationSlug = useSearchParams().get("organization");
  const organization = useOrganization(organizationSlug);

  const tWaitlist = useTranslations("waitlist");

  const { mutate: mutateGlobal } = useSWRConfig();

  const waitlistUrl = `/api/organizations/${organizationSlug}/waitlist`;

  const { data: waitlist, mutate } = useSWR<AdminWaitlistResponse>(
    organizationSlug ? `${waitlistUrl}/tickets` : null,
  );

  const refreshWaitlist = useCallback(
    () =>
      mutateGlobal(
        (key) =>
          key === `${waitlistUrl}/tickets` ||
          key ===
            `/api/organizations/${organizationSlug}/special-hours/affected` ||
          (Array.isArray(key) && key[0] === `${waitlistUrl}/tickets/list`),
      ),
    [mutateGlobal, organizationSlug, waitlistUrl],
  );

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected || !organization) return;

    emitMenuWithAck("joinWaitlist", { organizationId: organization.id })
      .then(refreshWaitlist)
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );

    menuSocket.on("waitlistUpdated", refreshWaitlist);

    return () => {
      menuSocket.off("waitlistUpdated", refreshWaitlist);
      menuSocket.emit("leaveWaitlist", {
        organizationId: organization.id,
      });
    };
  }, [isConnected, organization, refreshWaitlist]);

  if (!organizationSlug || !waitlist?.enabled) return null;

  const handleAddDialog = async () => {
    const latest = (await mutate()) || waitlist;

    setDialog({
      content: (
        <WaitlistTicketDialog
          maxPartySize={Math.max(
            ...latest.groups.map(({ maxPartySize }) => maxPartySize),
          )}
          mutate={refreshWaitlist}
          organizationSlug={organizationSlug}
          unavailable={
            !latest.open ? "closed" : latest.cutoff ? "cutoff" : null
          }
        />
      ),
      formId: WAITLIST_TICKET_FORM_ID,
      open: true,
      title: tWaitlist("add.label"),
    });
  };

  return (
    <HeaderStack direction="row">
      <Button onClick={handleAddDialog} startIcon={<Add />} variant="contained">
        {tWaitlist("add.label")}
      </Button>
    </HeaderStack>
  );
};

export default WaitlistControls;
