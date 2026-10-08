"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { Fragment, useEffect, useState } from "react";
import useSWR from "swr";

import {
  WAITLIST_GROUP_COLORS,
  WAITLIST_STATUS_COLORS,
} from "@/constants/waitlist";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import {
  AccessTime,
  Add,
  Campaign,
  Cancel,
  ConfirmationNumber,
  EventSeat,
  Person,
  Phone,
  SkipNext,
  type SvgIconComponent,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  DialogContentText,
  FormControlLabel,
  Link,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import AddWaitlistTicketDialog from "./AddWaitlistTicketDialog";

import SelectAllTransferList, {
  type SelectAllTransferListAction,
} from "@/components/SelectAllTransferList";

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

const COLUMN_STATUSES = [
  "waiting",
  "called",
  "seated",
  "noShow",
  "cancelled",
] as const satisfies readonly WaitlistTicketStatus[];

interface TicketAction {
  color: "error" | "primary" | "warning";
  label: "cancel" | "noShow" | "recall" | "seat";
  status: StaffTransitionStatus;
}

const TICKET_ACTIONS: Record<WaitlistTicketStatus, TicketAction[]> = {
  called: [
    { color: "primary", label: "recall", status: "called" },
    { color: "warning", label: "noShow", status: "noShow" },
    { color: "error", label: "cancel", status: "cancelled" },
  ],
  cancelled: [],
  noShow: [
    { color: "primary", label: "recall", status: "called" },
    { color: "primary", label: "seat", status: "seated" },
  ],
  seated: [],
  waiting: [{ color: "error", label: "cancel", status: "cancelled" }],
};

const HeaderStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const TitleStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  columnGap: theme.spacing(1),
  flexWrap: "wrap",
  justifyContent: "space-between",
}));

const ChipStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  gap: theme.spacing(0.5),
}));

const MetaStack = styled(Stack)(({ theme }) => ({
  columnGap: theme.spacing(1.5),
  flexWrap: "wrap",
}));

const MetaItemStack = styled(Stack)(({ theme }) => ({
  ...theme.typography.caption,
  alignItems: "center",
  gap: theme.spacing(0.5),
}));

const DetailsTypography = styled(Typography)({
  overflowWrap: "anywhere",
});

const StatusText = styled("span", {
  shouldForwardProp: (prop) => prop !== "as" && prop !== "status",
})<{ status: WaitlistTicketStatus }>(({ status, theme }) => {
  const color = WAITLIST_STATUS_COLORS[status];

  return {
    color:
      !color || color === "default"
        ? theme.vars.palette.text.primary
        : theme.vars.palette[color].main,
  };
});

interface AdminWaitlistProps {
  organization: Organization;
  waitlist: AdminWaitlistResponse;
}

const AdminWaitlist = ({
  organization: { id: organizationId, name, slug: organizationSlug },
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

  const handleTransitionDialog = (
    ticket: AdminWaitlistTicket,
    { label, status }: TicketAction,
  ) =>
    setDialog({
      content: (
        <DialogContentText>
          {tWaitlist.rich(`actions.${label}Confirm`, {
            bold: (chunks) => <strong>{chunks}</strong>,
            name: ticket.name,
            ticketNumber: ticket.ticketNumber,
          })}
        </DialogContentText>
      ),
      onConfirm: () => handleTransition(ticket, status),
      open: true,
      title: tWaitlist(`actions.${label}Title`),
    });

  const handleAddDialog = async () => {
    const latest = (await mutate()) || waitlist;

    setDialog({
      content: (
        <AddWaitlistTicketDialog
          maxPartySize={Math.max(
            ...latest.groups.map(({ maxPartySize }) => maxPartySize),
          )}
          onCreated={() => mutate()}
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
      formId: "add-waitlist-ticket-form",
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
        tWaitlist(paused ? "paused.on" : "paused.off", { name }),
        {
          variant: "success",
        },
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
            name,
          })}
        </DialogContentText>
      ),
      onConfirm: () => handleUpdatePaused(!checked),
      open: true,
      title: tWaitlist(checked ? "paused.resumeTitle" : "paused.title"),
    });

  const handleBatchTransition = async (
    ids: string[],
    status: "called" | "seated" | "waiting",
  ) => {
    const tickets = waitlist.tickets.filter(({ id }) => ids.includes(id));
    const results = await Promise.allSettled(
      tickets.map(({ id }) =>
        fetcher(`${waitlistUrl}/tickets/${id}/transitions/${status}`, {
          method: "PATCH",
        }),
      ),
    );
    const succeeded = tickets.filter(
      (_, index) => results[index].status === "fulfilled",
    );
    const failure = results.find((result) => result.status === "rejected");

    if (succeeded.length)
      enqueueSnackbar(
        tWaitlist("actions.success", {
          status: tWaitlist(`status.${status}`),
          ticketNumber: succeeded
            .map(({ ticketNumber }) => ticketNumber)
            .join(tCommon("delimiter")),
        }),
        { variant: "success" },
      );
    if (failure) showError(failure.reason);

    await mutate();

    return true;
  };

  const confirmBatchTransition = (
    ids: string[],
    status: "called" | "seated" | "waiting",
    title: React.ReactNode,
  ) =>
    new Promise<boolean>((resolve) => {
      setDialog({
        content: (
          <DialogContentText>
            {tWaitlist.rich("actions.transfer.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              status: tWaitlist(`status.${status}`),
              statusText: (chunks) => (
                <StatusText as="strong" status={status}>
                  {chunks}
                </StatusText>
              ),
              ticketNumbers: waitlist.tickets
                .filter(({ id }) => ids.includes(id))
                .map(({ ticketNumber }) => ticketNumber)
                .join(tCommon("delimiter")),
            })}
          </DialogContentText>
        ),
        onCancel: async () => resolve(false),
        onConfirm: async () => {
          await handleBatchTransition(ids, status);

          resolve(true);
        },
        open: true,
        title,
      });
    });

  const toTransferAction = (
    direction: "advance" | "revert",
    status: "called" | "seated" | "waiting",
  ): SelectAllTransferListAction => {
    const key = `actions.transfer.${direction}` as const;
    const statusLabel = tWaitlist(`status.${status}`);

    return {
      onTransfer: (ids) =>
        confirmBatchTransition(
          ids,
          status,
          tWaitlist.rich(key, {
            status: statusLabel,
            statusText: (chunks) => (
              <StatusText status={status}>{chunks}</StatusText>
            ),
          }),
        ),
      title: tWaitlist.markup(key, {
        status: statusLabel,
        statusText: (chunks) => chunks,
      }),
    };
  };

  const renderTitle = (ticket: AdminWaitlistTicket) => (
    <TitleStack direction="row">
      <Typography variant="body1">{ticket.ticketNumber}</Typography>
      <ChipStack direction="row">
        {ticket.status === "called" && ticket.overdue && (
          <Chip
            color="error"
            label={tWaitlist("ticket.overdue")}
            size="small"
          />
        )}
        {ticket.status === "called" && ticket.confirmedAt && (
          <Chip
            color="success"
            label={tWaitlist("ticket.confirmed")}
            size="small"
          />
        )}
        <Chip
          label={tWaitlist("ticket.partySize", { count: ticket.partySize })}
          size="small"
          variant="outlined"
        />
      </ChipStack>
    </TitleStack>
  );

  const renderDetails = (ticket: AdminWaitlistTicket) => {
    const formatTime = (date?: string | null) =>
      date ? format.dateTime(new Date(date), "time") : "";

    const times: {
      color?: "error" | "warning";
      icon: SvgIconComponent;
      text: string;
    }[] = {
      called: [
        {
          icon: Campaign,
          text: tWaitlist("ticket.calledAt", {
            time: formatTime(ticket.calledAt),
          }),
        },
        ticket.holdUntil && {
          color: ticket.overdue ? ("error" as const) : ("warning" as const),
          icon: AccessTime,
          text: tWaitlist("ticket.holdUntil", {
            time: formatTime(ticket.holdUntil),
          }),
        },
      ],
      cancelled: [
        {
          icon: Cancel,
          text: tWaitlist("ticket.cancelledAt", {
            time: formatTime(ticket.endedAt),
          }),
        },
      ],
      noShow: [
        {
          icon: SkipNext,
          text: tWaitlist("ticket.noShowAt", {
            time: formatTime(ticket.endedAt),
          }),
        },
      ],
      seated: [
        {
          icon: EventSeat,
          text: tWaitlist("ticket.seatedAt", {
            time: formatTime(ticket.endedAt),
          }),
        },
      ],
      waiting: [
        {
          icon: ConfirmationNumber,
          text: tWaitlist("ticket.createdAt", {
            time: formatTime(ticket.createdAt),
          }),
        },
      ],
    }[ticket.status].filter((time) => !!time);

    return (
      <Stack>
        <MetaStack direction="row">
          <MetaItemStack direction="row">
            <Person fontSize="inherit" />
            <DetailsTypography variant="caption">
              {ticket.name}
            </DetailsTypography>
          </MetaItemStack>
          <MetaItemStack direction="row">
            <Phone fontSize="inherit" />
            <Link
              href={`tel:${ticket.phoneNumber}`}
              onClick={(event) => event.stopPropagation()}
              variant="caption"
            >
              {ticket.phoneNumber}
            </Link>
          </MetaItemStack>
        </MetaStack>
        <MetaStack direction="row">
          {times.map(({ color, icon: Icon, text }) => (
            <MetaItemStack direction="row" key={text}>
              <Icon color={color} fontSize="inherit" />
              <Typography color={color} variant="caption">
                {text}
              </Typography>
            </MetaItemStack>
          ))}
        </MetaStack>
      </Stack>
    );
  };

  const renderActions = (ticket: AdminWaitlistTicket) =>
    TICKET_ACTIONS[ticket.status].length > 0 &&
    TICKET_ACTIONS[ticket.status].map((action) => (
      <Button
        color={action.color}
        disabled={
          !!pendingAction && pendingAction !== `${ticket.id}:${action.status}`
        }
        key={action.label}
        loading={pendingAction === `${ticket.id}:${action.status}`}
        onClick={() => handleTransitionDialog(ticket, action)}
        size="small"
        variant="outlined"
      >
        {tWaitlist(`actions.${action.label}`)}
      </Button>
    ));

  if (!waitlist.enabled)
    return <Alert severity="info">{tWaitlist("disabled")}</Alert>;

  const getGroupIndex = (prefix: string) =>
    waitlist.groups.findIndex((group) => group.prefix === prefix);

  const getGroupLabel = (prefix: string, count: number) => {
    const group = waitlist.groups[getGroupIndex(prefix)];
    const range =
      !group || group.minPartySize === group.maxPartySize
        ? tWaitlist("single", { count: group?.minPartySize || 0 })
        : tWaitlist("range", {
            max: group.maxPartySize,
            min: group.minPartySize,
          });

    return `${tWaitlist("group", { prefix })}${tCommon("delimiter")}${range}${tCommon("parenthesisOpen")}${count}${tCommon("parenthesisClose")}`;
  };

  const getGroup = (
    ticket: AdminWaitlistTicket,
    tickets: AdminWaitlistTicket[],
  ) => ({
    color:
      WAITLIST_GROUP_COLORS[
        Math.max(getGroupIndex(ticket.prefix), 0) % WAITLIST_GROUP_COLORS.length
      ],
    label: getGroupLabel(
      ticket.prefix,
      tickets.filter(({ prefix }) => prefix === ticket.prefix).length,
    ),
  });

  const columns = COLUMN_STATUSES.map((status) => {
    const isEnded = status === "noShow" || status === "cancelled";
    const tickets = waitlist.tickets
      .filter((ticket) => ticket.status === status)
      .sort(
        (a, b) =>
          getGroupIndex(a.prefix) - getGroupIndex(b.prefix) ||
          (status === "called"
            ? new Date(a.calledAt || 0).getTime() -
              new Date(b.calledAt || 0).getTime()
            : status === "waiting"
              ? 0
              : new Date(b.endedAt || 0).getTime() -
                new Date(a.endedAt || 0).getTime()),
      );

    return {
      color: WAITLIST_STATUS_COLORS[status],
      defaultExpanded: isEnded ? false : undefined,
      emptyLabel: tWaitlist("empty"),
      items: tickets.map((ticket) => ({
        group: getGroup(ticket, tickets),
        id: ticket.id,
        primary: renderTitle(ticket),
        secondary: renderDetails(ticket),
        actions: renderActions(ticket),
      })),
      size: { xs: 12, md: isEnded ? ("grow" as const) : 4 },
      subheader: isEnded
        ? tWaitlist("count", { count: tickets.length })
        : undefined,
      title: tWaitlist(`status.${status}`),
    };
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
        <FormControlLabel
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
      <SelectAllTransferList
        columns={columns}
        transferActions={[
          [
            toTransferAction("advance", "called"),
            toTransferAction("revert", "waiting"),
          ],
          [
            toTransferAction("advance", "seated"),
            toTransferAction("revert", "called"),
          ],
          null,
          null,
        ]}
      />
    </>
  );
};

export default AdminWaitlist;
