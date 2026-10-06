"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { WAITLIST_STATUS_COLORS } from "@/constants/waitlist";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import { Add } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Link,
  List,
  ListItemText,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import AddWaitlistTicketDialog from "./AddWaitlistTicketDialog";

import CustomizedAccordions from "@/components/CustomizedAccordions";
import { StyledListItem } from "@/components/FormCard";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Organization } from "@/types/organizations";
import type {
  AdminWaitlistResponse,
  AdminWaitlistTicket,
  WaitlistTicketStatus,
} from "@/types/waitlist";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getWaitlistErrorCode } from "@/utils/waitlist";

type StaffTransitionStatus = Exclude<WaitlistTicketStatus, "waiting">;

const TICKET_ACTIONS: Record<
  WaitlistTicketStatus,
  {
    color: "error" | "primary" | "warning";
    label: "call" | "cancel" | "noShow" | "recall" | "seat";
    status: StaffTransitionStatus;
    variant: "contained" | "outlined" | "text";
  }[]
> = {
  called: [
    { color: "primary", label: "seat", status: "seated", variant: "contained" },
    {
      color: "primary",
      label: "recall",
      status: "called",
      variant: "outlined",
    },
    { color: "warning", label: "noShow", status: "noShow", variant: "text" },
  ],
  cancelled: [],
  noShow: [
    { color: "primary", label: "seat", status: "seated", variant: "outlined" },
  ],
  seated: [],
  waiting: [
    { color: "primary", label: "call", status: "called", variant: "contained" },
    { color: "primary", label: "seat", status: "seated", variant: "outlined" },
    { color: "error", label: "cancel", status: "cancelled", variant: "text" },
  ],
};

const HeaderStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const StyledCard = styled(Card)({
  height: "100%",
});

const TitleStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  columnGap: theme.spacing(1),
  flexWrap: "wrap",
}));

const ActionsStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  gap: theme.spacing(1),
}));

const BoldTypography = styled(Typography)({
  fontWeight: "bold",
});

const StyledEmptyTypography = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
}));

interface AdminWaitlistProps {
  organization: Organization;
  waitlist: AdminWaitlistResponse;
}

const AdminWaitlist = ({
  organization: { id: organizationId, slug: organizationSlug },
  waitlist: initialWaitlist,
}: AdminWaitlistProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState(false);

  const format = useFormatter();

  const tCommon = useTranslations("common");
  const tWaitlist = useTranslations("waitlist");

  const waitlistUrl = `/api/organizations/${organizationSlug}/waitlist`;

  const { data: waitlist = initialWaitlist, mutate } =
    useSWR<AdminWaitlistResponse>(`${waitlistUrl}/tickets`, {
      fallbackData: initialWaitlist,
    });

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected) return;

    menuSocket
      .timeout(5000)
      .emitWithAck("joinWaitlist", { organizationId })
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );

    const handleUpdate = () => {
      mutate();
    };

    menuSocket.on("waitlistUpdated", handleUpdate);

    return () => {
      menuSocket.off("waitlistUpdated", handleUpdate);
    };
  }, [isConnected, mutate, organizationId]);

  const showError = (error: unknown) => {
    const code = getWaitlistErrorCode(error);

    enqueueSnackbar(
      code ? tWaitlist(`errors.${code}`) : getErrorMessage(error),
      { variant: "error" },
    );
  };

  const handleTransition = async (
    ticket: AdminWaitlistTicket,
    status: StaffTransitionStatus,
  ) => {
    setPendingAction(`${ticket.id}:${status}`);

    try {
      await fetcher(
        `${waitlistUrl}/tickets/${ticket.id}/transitions/${status}`,
        { method: "PATCH" },
      );

      enqueueSnackbar(
        tWaitlist("actions.success", {
          status: tWaitlist(`status.${status}`),
          ticketNumber: ticket.ticketNumber,
        }),
        { variant: "success" },
      );
    } catch (error) {
      showError(error);
    } finally {
      await mutate();
      setPendingAction(null);
    }
  };

  const handleCancelDialog = (ticket: AdminWaitlistTicket) =>
    setDialog({
      contentText: tWaitlist("actions.cancelConfirm", {
        name: ticket.name,
        ticketNumber: ticket.ticketNumber,
      }),
      onConfirm: () => handleTransition(ticket, "cancelled"),
      open: true,
      title: tWaitlist("actions.cancelTitle"),
    });

  const handleAddDialog = () =>
    setDialog({
      content: (
        <AddWaitlistTicketDialog
          maxPartySize={Math.max(
            ...waitlist.groups.map(({ maxPartySize }) => maxPartySize),
          )}
          onCreated={() => mutate()}
          organizationSlug={organizationSlug}
        />
      ),
      formId: "add-waitlist-ticket-form",
      open: true,
      title: tWaitlist("add.label"),
    });

  const handlePausedChange = async (
    _event: React.ChangeEvent<HTMLInputElement>,
    paused: boolean,
  ) => {
    setIsPausing(true);

    try {
      await fetcher(`${waitlistUrl}/paused`, {
        body: JSON.stringify({ paused }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });

      enqueueSnackbar(tWaitlist(paused ? "paused.on" : "paused.off"), {
        variant: "success",
      });
    } catch (error) {
      showError(error);
    } finally {
      await mutate();
      setIsPausing(false);
    }
  };

  const renderTicket = (
    ticket: AdminWaitlistTicket,
    index: number,
    tickets: AdminWaitlistTicket[],
  ) => (
    <StyledListItem
      divider={index < tickets.length - 1}
      key={ticket.id}
      secondaryAction={
        <ActionsStack direction="row">
          {TICKET_ACTIONS[ticket.status].map(
            ({ color, label, status, variant }) => (
              <Button
                color={color}
                disabled={
                  !!pendingAction && pendingAction !== `${ticket.id}:${status}`
                }
                key={label}
                loading={pendingAction === `${ticket.id}:${status}`}
                onClick={() =>
                  status === "cancelled"
                    ? handleCancelDialog(ticket)
                    : handleTransition(ticket, status)
                }
                size="small"
                variant={variant}
              >
                {tWaitlist(`actions.${label}`)}
              </Button>
            ),
          )}
        </ActionsStack>
      }
    >
      <ListItemText
        primary={
          <TitleStack direction="row">
            <BoldTypography variant="h6">{ticket.ticketNumber}</BoldTypography>
            <Typography variant="body2">
              {tWaitlist("ticket.partySize", { count: ticket.partySize })}
            </Typography>
            <Chip
              color={WAITLIST_STATUS_COLORS[ticket.status]}
              label={tWaitlist(`status.${ticket.status}`)}
              size="small"
              variant="outlined"
            />
            {ticket.status === "called" && ticket.confirmedAt && (
              <Chip
                color="success"
                label={tWaitlist("ticket.confirmed")}
                size="small"
              />
            )}
          </TitleStack>
        }
        secondary={
          <>
            {[
              ticket.name,
              tWaitlist("ticket.createdAt", {
                time: format.dateTime(new Date(ticket.createdAt), "time"),
              }),
              ticket.calledAt &&
                tWaitlist("ticket.calledAt", {
                  time: format.dateTime(new Date(ticket.calledAt), "time"),
                }),
              ticket.holdUntil &&
                tWaitlist("ticket.holdUntil", {
                  time: format.dateTime(new Date(ticket.holdUntil), "time"),
                }),
            ]
              .filter(Boolean)
              .join(tCommon("delimiter"))}
            <br />
            <Link href={`tel:${ticket.phoneNumber}`}>{ticket.phoneNumber}</Link>
          </>
        }
        slotProps={{ primary: { component: "div" } }}
      />
    </StyledListItem>
  );

  if (!waitlist.enabled)
    return <Alert severity="info">{tWaitlist("disabled")}</Alert>;

  const activeTickets = waitlist.tickets.filter(
    ({ status }) => status === "waiting" || status === "called",
  );
  const endedTickets = waitlist.tickets.filter(
    ({ status }) => status !== "waiting" && status !== "called",
  );

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
        <FormControlLabel
          control={
            <Switch
              checked={waitlist.paused}
              disabled={isPausing}
              onChange={handlePausedChange}
            />
          }
          label={tWaitlist("paused.label")}
        />
        <Typography color="textSecondary" variant="body2">
          {tWaitlist("waitingCount", {
            count: activeTickets.filter(({ status }) => status === "waiting")
              .length,
          })}
        </Typography>
      </HeaderStack>
      <Grid container spacing={2}>
        {waitlist.groups.map((group) => {
          const tickets = activeTickets
            .filter(({ prefix }) => prefix === group.prefix)
            .sort(
              (a, b) =>
                Number(b.status === "called") - Number(a.status === "called"),
            );

          return (
            <Grid key={group.prefix} size={{ xs: 12, md: 6 }}>
              <StyledCard variant="outlined">
                <CardHeader
                  subheader={
                    group.minPartySize === group.maxPartySize
                      ? tWaitlist("single", { count: group.minPartySize })
                      : tWaitlist("range", {
                          max: group.maxPartySize,
                          min: group.minPartySize,
                        })
                  }
                  title={tWaitlist("group", { prefix: group.prefix })}
                />
                <Divider />
                <List disablePadding>
                  {tickets.length ? (
                    tickets.map(renderTicket)
                  ) : (
                    <StyledEmptyTypography
                      color="textSecondary"
                      variant="body2"
                    >
                      {tWaitlist("empty")}
                    </StyledEmptyTypography>
                  )}
                </List>
              </StyledCard>
            </Grid>
          );
        })}
      </Grid>
      <CustomizedAccordions
        summary={tWaitlist("ended", { count: endedTickets.length })}
      >
        <List disablePadding>
          {endedTickets.length ? (
            endedTickets.map(renderTicket)
          ) : (
            <StyledEmptyTypography color="textSecondary" variant="body2">
              {tWaitlist("empty")}
            </StyledEmptyTypography>
          )}
        </List>
      </CustomizedAccordions>
    </>
  );
};

export default AdminWaitlist;
