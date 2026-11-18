"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useRef, useState } from "react";
import useSWR from "swr";

import ChecklistRunItemContent, {
  useChecklistItemRangeText,
} from "../ChecklistRunItemContent";
import ChecklistRunStatusChip from "../ChecklistRunStatusChip";
import ChecklistItemDialog, {
  CHECKLIST_ITEM_FORM_ID,
} from "./ChecklistItemDialog";

import {
  Card,
  CardHeader,
  Grid,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  ChecklistRun,
  ChecklistRunItem,
  FillChecklistItemDto,
} from "@/types/checklists";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface ChecklistTodayProps {
  closed: boolean;
  organizationSlug: string;
  runs: ChecklistRun[];
}

const ChecklistToday = ({
  closed,
  organizationSlug,
  runs: initialRuns,
}: ChecklistTodayProps) => {
  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const inFlight = useRef(0);
  const stale = useRef(false);

  const { setDialog } = useDialogStore((state) => state);

  const getRangeText = useChecklistItemRangeText();

  const tChecklists = useTranslations("checklists");

  const todayUrl = `/api/organizations/${organizationSlug}/checklists/today`;

  const { data: runs, mutate } = useSWR(
    todayUrl,
    (url: string) => fetcher<ChecklistRun[]>(url),
    { fallbackData: initialRuns },
  );

  const fill = async (
    templateId: ChecklistRun["templateId"],
    itemId: string,
    dto: FillChecklistItemDto,
  ) => {
    inFlight.current += 1;
    if (inFlight.current > 1) stale.current = true;

    setPendingItemIds((ids) => new Set(ids).add(itemId));

    try {
      const run = await fetcher<ChecklistRun>(
        `${todayUrl}/${templateId}/items/${itemId}`,
        {
          body: JSON.stringify(dto),
          headers: { "Content-Type": "application/json" },
          method: "PUT",
        },
      );

      if (!stale.current)
        await mutate(
          (current = runs) =>
            current.map((previous) =>
              previous.templateId === run.templateId ? run : previous,
            ),
          { revalidate: false },
        );
    } catch (error) {
      stale.current = true;

      throw error;
    } finally {
      inFlight.current -= 1;

      setPendingItemIds((ids) => {
        const next = new Set(ids);
        next.delete(itemId);

        return next;
      });

      if (!inFlight.current && stale.current) {
        stale.current = false;
        void mutate();
      }
    }
  };

  const handleSelect = async (
    { templateId }: ChecklistRun,
    item: ChecklistRunItem,
  ) => {
    if (item.type === "number") {
      setDialog({
        content: (
          <ChecklistItemDialog
            item={item}
            onSubmit={(dto) => fill(templateId, item.id, dto)}
            rangeText={getRangeText(item)}
          />
        ),
        formId: CHECKLIST_ITEM_FORM_ID,
        open: true,
        title: item.label,
      });

      return;
    }

    try {
      await fill(templateId, item.id, { checked: !item.checked });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    }
  };

  if (!runs.length)
    return (
      <Typography color="textSecondary">
        {tChecklists("today.empty")}
      </Typography>
    );

  return (
    <Grid container spacing={2}>
      {runs.map((run) => (
        <Grid key={run.templateId} size={{ xs: 12, md: 6, xl: 4 }}>
          <Card variant="outlined">
            <CardHeader
              action={<ChecklistRunStatusChip run={run} />}
              subheader={tChecklists(`templates.timing.${run.timing}`)}
              title={run.name}
            />
            <List disablePadding>
              {run.items.map((item) => (
                <ListItem disablePadding divider key={item.id}>
                  <ListItemButton
                    disabled={closed || pendingItemIds.has(item.id)}
                    onClick={() => void handleSelect(run, item)}
                  >
                    <ChecklistRunItemContent item={item} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default ChecklistToday;
