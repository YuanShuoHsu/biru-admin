"use client";

import { useTranslations } from "next-intl";

import ChartCard from "../ChartCard";

import { useRoutes } from "@/hooks/useRoutes";

import { Grid, List, ListItem, ListItemText, Typography } from "@mui/material";

import { useChecklistRunStatusLabel } from "@/app/[locale]/(app)/(dashboard)/checklists/(tabs)/ChecklistRunStatusChip";

import type { ChecklistRun } from "@/types/checklists";

interface ChecklistsProps {
  runs: ChecklistRun[];
}

const Checklists = ({ runs }: ChecklistsProps) => {
  const tChecklists = useTranslations("checklists");
  const tDashboard = useTranslations("dashboard");

  const navItem = useRoutes();

  const getStatusLabel = useChecklistRunStatusLabel();

  const incompleteRuns = runs.filter(({ completedAt }) => !completedAt);

  return (
    <>
      <Typography component="h2" variant="h6">
        {tChecklists("label")}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ChartCard
            href={navItem("/checklists/today").to}
            period={tDashboard("stats.period.today")}
            title={tDashboard("checklists.incomplete")}
            value={
              <Typography component="p" variant="h4">
                {tDashboard("checklists.incompleteValue", {
                  incomplete: incompleteRuns.length,
                  total: runs.length,
                })}
              </Typography>
            }
          >
            {!!incompleteRuns.length && (
              <List dense disablePadding>
                {incompleteRuns.map((run) => (
                  <ListItem disableGutters key={run.templateId}>
                    <ListItemText
                      primary={run.name}
                      secondary={getStatusLabel(run)}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
};

export default Checklists;
