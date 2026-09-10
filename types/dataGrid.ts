import { filterOperatorValues, sortDirectionValues } from "@/types/api";

export type FilterOperator = (typeof filterOperatorValues)[number];
export type SortDirection = (typeof sortDirectionValues)[number];
