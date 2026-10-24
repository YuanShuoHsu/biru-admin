import { cache } from "react";

import { fetcher } from "./fetcher";

import type {
  DeletedRecordBatch,
  DeletedRecordFilterField,
  DeletedRecordPermission,
  DeletedRecordSortField,
} from "@/types/deletedRecords";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

export const getDeletedRecordsPath = (organizationSlug?: string) =>
  organizationSlug
    ? `/api/organizations/${organizationSlug}/deleted-records`
    : "/api/deleted-records";

export const getDeletedRecords = cache(
  async (
    organizationSlug: string | undefined,
    query: GridQuery<DeletedRecordFilterField, DeletedRecordSortField> = {},
    init?: RequestInit,
  ) => {
    try {
      const result = await fetcher<{
        data: DeletedRecordBatch[];
        total: number;
      }>(
        `${getDeletedRecordsPath(organizationSlug)}?${getGridSearchParams(query).toString()}`,
        init,
      );

      return {
        deletedRecords: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { deletedRecords: [], total: 0 };
    }
  },
);

export const canRestoreDeletedRecords = async (
  organizationSlug: string,
  init?: RequestInit,
) => {
  try {
    const { canRestore } = await fetcher<DeletedRecordPermission>(
      `/api/organizations/${organizationSlug}/deleted-records/permission`,
      init,
    );

    return canRestore;
  } catch {
    return false;
  }
};
