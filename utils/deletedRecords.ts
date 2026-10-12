import { cache } from "react";

import { fetcher } from "./fetcher";

import type { DeletedRecordBatch } from "@/types/deletedRecords";

export const getDeletedRecords = cache(
  async (page: number, pageSize: number, init?: RequestInit) => {
    try {
      const params = new URLSearchParams({
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
      });

      const result = await fetcher<{
        data: DeletedRecordBatch[];
        total: number;
      }>(`/api/deleted-records?${params.toString()}`, init);

      return {
        deletedRecords: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { deletedRecords: [], total: 0 };
    }
  },
);
