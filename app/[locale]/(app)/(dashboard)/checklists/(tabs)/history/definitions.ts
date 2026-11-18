import type { GridPaginationModel } from "@mui/x-data-grid";

export interface ChecklistRunFilters {
  from: string;
  templateId: string;
  to: string;
}

export const getChecklistRunsUrl = (
  organizationSlug: string,
  { page, pageSize }: GridPaginationModel,
  filters: ChecklistRunFilters,
) =>
  `/api/organizations/${organizationSlug}/checklists/runs?${new URLSearchParams(
    {
      limit: String(pageSize),
      offset: String(page * pageSize),
      ...Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value),
      ),
    },
  )}`;
