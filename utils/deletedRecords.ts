import { cache } from "react";

import { fetcher } from "./fetcher";

import type {
  DeletedRecordBatch,
  DeletedRecordPermission,
} from "@/types/deletedRecords";

export const getDeletedRecordsPath = (organizationSlug?: string) =>
  organizationSlug
    ? `/api/organizations/${organizationSlug}/deleted-records`
    : "/api/deleted-records";

export const getDeletedRecords = cache(
  async (
    organizationSlug: string | undefined,
    page: number,
    pageSize: number,
    init?: RequestInit,
  ) => {
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });

      const result = await fetcher<{
        data: DeletedRecordBatch[];
        total: number;
      }>(
        `${getDeletedRecordsPath(organizationSlug)}?${params.toString()}`,
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
