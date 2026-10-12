import { type components, deletedRecordTableValues } from "@/types/api";

export type DeletedRecordBatch =
  components["schemas"]["DeletedRecordBatchResponseDto"];

export type DeletedRecordTable = (typeof deletedRecordTableValues)[number];
