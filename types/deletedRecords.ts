import { type components, deletedRecordTableValues } from "@/types/api";

export type DeletedRecordBatch =
  components["schemas"]["DeletedRecordBatchResponseDto"];

export type DeletedRecordPermission =
  components["schemas"]["DeletedRecordPermissionDto"];

export type DeletedRecordTable = (typeof deletedRecordTableValues)[number];
