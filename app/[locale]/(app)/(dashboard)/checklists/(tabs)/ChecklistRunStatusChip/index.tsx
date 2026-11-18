import { useFormatter, useTranslations } from "next-intl";
import { useCallback } from "react";

import { CheckCircle } from "@mui/icons-material";
import { Chip } from "@mui/material";

import type { ChecklistRun } from "@/types/checklists";

export const useChecklistRunStatusLabel = () => {
  const format = useFormatter();

  const tChecklists = useTranslations("checklists");

  return useCallback(
    ({ completedAt, filledCount, items }: ChecklistRun) =>
      completedAt
        ? tChecklists("runs.completed", {
            time: format.dateTime(new Date(completedAt), "time"),
          })
        : tChecklists("runs.progress", {
            filled: filledCount,
            total: items.length,
          }),
    [format, tChecklists],
  );
};

interface ChecklistRunStatusChipProps {
  run: ChecklistRun;
}

const ChecklistRunStatusChip = ({ run }: ChecklistRunStatusChipProps) => {
  const getStatusLabel = useChecklistRunStatusLabel();

  return run.completedAt ? (
    <Chip
      color="success"
      icon={<CheckCircle />}
      label={getStatusLabel(run)}
      size="small"
    />
  ) : (
    <Chip label={getStatusLabel(run)} size="small" variant="outlined" />
  );
};

export default ChecklistRunStatusChip;
