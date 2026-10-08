"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { useOrganization } from "@/hooks/organizations";
import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import { Add } from "@mui/icons-material";
import {
  Alert,
  Button,
  DialogContentText,
  FormControlLabel,
  Stack,
  Switch,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import WaitlistTicketDialog, {
  WAITLIST_TICKET_FORM_ID,
} from "../WaitlistTicketDialog";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminWaitlistResponse } from "@/types/waitlist";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getWaitlistErrorCode } from "@/utils/waitlist";

const HeaderStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

const StyledFormControlLabel = styled(FormControlLabel)({
  marginRight: 0,
});

const WaitlistControls = () => {
  const { setDialog } = useDialogStore((state) => state);

  const [isPausing, setIsPausing] = useState(false);

  const organizationSlug = useSearchParams().get("organization");
  const organization = useOrganization(organizationSlug);
  const name = organization?.name;

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
          (Array.isArray(key) && key[0] === `${waitlistUrl}/tickets/list`),
      ),
    [mutateGlobal, waitlistUrl],
  );

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected || !organization) return;

    menuSocket
      .timeout(5000)
      .emitWithAck("joinWaitlist", { organizationId: organization.id })
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );

    menuSocket.on("waitlistUpdated", refreshWaitlist);

    return () => {
      menuSocket.off("waitlistUpdated", refreshWaitlist);
    };
  }, [isConnected, organization, refreshWaitlist]);

  if (!organizationSlug || !waitlist?.enabled) return null;

  const showError = (error: unknown) => {
    const code = getWaitlistErrorCode(error);

    enqueueSnackbar(
      code ? tWaitlist(`errors.${code}`) : getErrorMessage(error),
      { variant: "error" },
    );
  };

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
            latest.paused
              ? "paused"
              : !latest.open
                ? "closed"
                : latest.cutoff
                  ? "cutoff"
                  : null
          }
        />
      ),
      formId: WAITLIST_TICKET_FORM_ID,
      open: true,
      title: tWaitlist("add.label"),
    });
  };

  const handleUpdatePaused = async (paused: boolean) => {
    setIsPausing(true);

    try {
      await fetcher(`${waitlistUrl}/paused`, {
        body: JSON.stringify({ paused }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });

      enqueueSnackbar(
        tWaitlist(paused ? "paused.on" : "paused.off", { name: name || "" }),
        { variant: "success" },
      );
    } catch (error) {
      showError(error);
    } finally {
      await mutate();
      setIsPausing(false);
    }
  };

  const handleAcceptingChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean,
  ) =>
    setDialog({
      content: (
        <DialogContentText>
          {tWaitlist.rich(checked ? "paused.resumeConfirm" : "paused.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            name: name || "",
          })}
        </DialogContentText>
      ),
      onConfirm: () => handleUpdatePaused(!checked),
      open: true,
      title: tWaitlist(checked ? "paused.resumeTitle" : "paused.title"),
    });

  return (
    <>
      <HeaderStack direction="row">
        <Button
          onClick={handleAddDialog}
          startIcon={<Add />}
          variant="contained"
        >
          {tWaitlist("add.label")}
        </Button>
        <StyledFormControlLabel
          control={
            <Switch
              checked={!waitlist.paused}
              disabled={isPausing}
              onChange={handleAcceptingChange}
            />
          }
          label={tWaitlist("accepting")}
        />
      </HeaderStack>
      {waitlist.paused && (
        <Alert severity="warning">{tWaitlist("add.unavailable.paused")}</Alert>
      )}
    </>
  );
};

export default WaitlistControls;
