"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import useSWR from "swr";

import { WAITLIST_STATUS_COLORS } from "@/constants/waitlist";

import {
  AccessTime,
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
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import WaitlistTicketDialog, {
  WAITLIST_TICKET_FORM_ID,
} from "../../WaitlistTicketDialog";

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

const COLUMN_STATUSES = [
  "waiting",
  "called",
  "seated",
  "noShow",
  "cancelled",
] as const satisfies readonly WaitlistTicketStatus[];

const TRANSITION_LABELS = {
  called: "recall",
  cancelled: "cancel",
  noShow: "noShow",
  seated: "seat",
  waiting: "restore",
} as const satisfies Record<WaitlistTicketStatus, string>;

const TRANSFER_TRANSITIONS: Partial<
  Record<WaitlistTicketStatus, WaitlistTicketStatus[]>
> = {
  called: ["waiting", "seated"],
  seated: ["called"],
  waiting: ["called"],
};

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
  organization: { slug: organizationSlug },
  waitlist: initialWaitlist,
}: AdminWaitlistProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });

  const tCommon = useTranslations("common");
  const tWaitlist = useTranslations("waitlist");

  const waitlistUrl = `/api/organizations/${organizationSlug}/waitlist`;

  const { data: waitlist = initialWaitlist, mutate } =
    useSWR<AdminWaitlistResponse>(`${waitlistUrl}/tickets`, {
      fallbackData: initialWaitlist,
    });

  const showError = (error: unknown) => {
    const code = getWaitlistErrorCode(error);

    enqueueSnackbar(
      code ? tWaitlist(`errors.${code}`) : getErrorMessage(error),
      { variant: "error" },
    );
  };

  const handleTransition = async (
    ticket: AdminWaitlistTicket,
    status: WaitlistTicketStatus,
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
    status: WaitlistTicketStatus,
  ) => {
    const label = TRANSITION_LABELS[status];

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
  };

  const getMaxPartySize = ({ groups }: AdminWaitlistResponse) =>
    Math.max(...groups.map(({ maxPartySize }) => maxPartySize));

  const handleEditDialog = async (ticket: AdminWaitlistTicket) => {
    const latest = (await mutate()) || waitlist;

    setDialog({
      content: (
        <WaitlistTicketDialog
          maxPartySize={getMaxPartySize(latest)}
          mutate={() => mutate()}
          organizationSlug={organizationSlug}
          ticket={ticket}
        />
      ),
      formId: WAITLIST_TICKET_FORM_ID,
      open: true,
      title: tWaitlist("edit.label"),
    });
  };

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
    const formatTime = (date?: string | null) => {
      if (!date) return "";

      const time = new Date(date);
      const isToday =
        format.dateTime(time, "date") === format.dateTime(now, "date");

      return format.dateTime(time, isToday ? "time" : "compact");
    };

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

  const renderActions = (ticket: AdminWaitlistTicket) => {
    const statuses = ticket.availableTransitions.filter(
      (status) => !TRANSFER_TRANSITIONS[ticket.status]?.includes(status),
    );
    const editable = ticket.status === "waiting" || ticket.status === "called";

    if (!editable && !statuses.length) return null;

    return (
      <>
        {editable && (
          <Button
            color="inherit"
            disabled={!!pendingAction}
            onClick={() => handleEditDialog(ticket)}
            size="small"
            variant="outlined"
          >
            {tWaitlist("edit.action")}
          </Button>
        )}
        {statuses.map((status) => {
          const color = WAITLIST_STATUS_COLORS[status];

          return (
            <Button
              color={color === "default" ? "inherit" : color}
              disabled={
                !!pendingAction && pendingAction !== `${ticket.id}:${status}`
              }
              key={status}
              loading={pendingAction === `${ticket.id}:${status}`}
              onClick={() => handleTransitionDialog(ticket, status)}
              size="small"
              variant="outlined"
            >
              {tWaitlist(`actions.${TRANSITION_LABELS[status]}`)}
            </Button>
          );
        })}
      </>
    );
  };

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
