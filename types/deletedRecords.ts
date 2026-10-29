import {
  type components,
  deletedRecordFilterFieldValues,
  deletedRecordSortFieldValues,
} from "@/types/api";

export type DeletedRecordBatch =
  components["schemas"]["DeletedRecordBatchResponseDto"];
export type DeletedRecordBatchListResponse =
  components["schemas"]["DeletedRecordBatchListResponseDto"];

export type DeletedRecordPermission =
  components["schemas"]["DeletedRecordPermissionDto"];

export type DeletedRecordFilterField =
  (typeof deletedRecordFilterFieldValues)[number];
export type DeletedRecordSortField =
  (typeof deletedRecordSortFieldValues)[number];
