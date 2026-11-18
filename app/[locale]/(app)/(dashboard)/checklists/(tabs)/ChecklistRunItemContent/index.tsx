import { useFormatter, useTranslations } from "next-intl";
import { useCallback } from "react";

import {
  Checkbox,
  Chip,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { ChecklistRunItem } from "@/types/checklists";

const SecondaryStack = styled(Stack)(({ theme }) => ({
  alignItems: "flex-start",
  gap: theme.spacing(0.5),
}));

export const useChecklistItemRangeText = () => {
  const tChecklists = useTranslations("checklists");

  return useCallback(
    ({ maxValue, minValue, type, unit }: ChecklistRunItem) =>
      type !== "number" || (minValue === null && maxValue === null)
        ? null
        : tChecklists("runs.range", {
            bounds:
              maxValue === null ? "min" : minValue === null ? "max" : "both",
            max: maxValue ?? "",
            min: minValue ?? "",
            unit: unit ?? "",
          }),
    [tChecklists],
  );
};

interface ChecklistRunItemContentProps {
  item: ChecklistRunItem;
}

const ChecklistRunItemContent = ({ item }: ChecklistRunItemContentProps) => {
  const format = useFormatter();

  const rangeText = useChecklistItemRangeText()(item);

  const tChecklists = useTranslations("checklists");
  const tCommon = useTranslations("common");

  return (
    <>
      {item.type === "check" && (
        <ListItemIcon>
          <Checkbox
            checked={!!item.checked}
            disableRipple
            edge="start"
            readOnly
            size="large"
            slotProps={{
              input: { "aria-labelledby": item.id },
            }}
            tabIndex={-1}
          />
        </ListItemIcon>
      )}
      <ListItemText
        id={item.id}
        primary={item.label}
        secondary={
          <SecondaryStack>
            {rangeText && <span>{rangeText}</span>}
            {item.filledAt && (
              <span>
                {[
                  item.filledByName ?? tCommon("deletedAccount"),
                  format.dateTime(new Date(item.filledAt), "time"),
                ].join(tCommon("middleDot"))}
              </span>
            )}
            {item.outOfRange && (
              <Chip
                color="error"
                label={tChecklists("runs.outOfRange")}
                size="small"
              />
            )}
            {item.actionNote && (
              <span>
                {tChecklists("runs.actionNote")}
                {tCommon("colon")}
                {item.actionNote}
              </span>
            )}
          </SecondaryStack>
        }
        slotProps={{ secondary: { component: "div" } }}
      />
      {item.value !== null && (
        <Typography color={item.outOfRange ? "error" : undefined} variant="h6">
          {format.number(item.value)} {item.unit}
        </Typography>
      )}
    </>
  );
};

export default ChecklistRunItemContent;
