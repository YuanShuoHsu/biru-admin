import CustomNoColumnsOverlay from "@/components/CustomNoColumnsOverlay";
import CustomNoResultsOverlay from "@/components/CustomNoResultsOverlay";
import CustomNoRowsOverlay from "@/components/CustomNoRowsOverlay";
import CustomPagination from "@/components/CustomPagination";
import {
  SortedAscendingIcon,
  SortedDescendingIcon,
  UnsortedIcon,
} from "@/components/CustomSortIcons";
import CustomToolbar from "@/components/CustomToolbar";
import { GridAutosizeOptions } from "@mui/x-data-grid";

export const autosizeOptions: GridAutosizeOptions = {
  includeHeaders: true,
  includeOutliers: true,
};

export const DATA_GRID_PROPS = {
  autosizeOnMount: true,
  autosizeOptions,
  disableRowSelectionOnClick: true,
  getRowClassName: ({
    indexRelativeToCurrentPage,
  }: {
    indexRelativeToCurrentPage: number;
  }) => (indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"),
  initialState: {
    pagination: { paginationModel: { pageSize: 10 } },
  },
  pageSizeOptions: [5, 10, 50, 100],
  showToolbar: true,
  slotProps: {
    basePagination: {
      material: {
        ActionsComponent: CustomPagination,
      },
    },
  },
  slots: {
    columnSortedAscendingIcon: SortedAscendingIcon,
    columnSortedDescendingIcon: SortedDescendingIcon,
    columnUnsortedIcon: UnsortedIcon,
    noColumnsOverlay: CustomNoColumnsOverlay,
    noResultsOverlay: CustomNoResultsOverlay,
    noRowsOverlay: CustomNoRowsOverlay,
    toolbar: CustomToolbar,
  },
} as const;

export const NO_VALUE_FILTER_OPERATORS: readonly string[] = [
  "isEmpty",
  "isNotEmpty",
];

export const STRING_FILTER_OPERATORS = [
  "contains",
  "doesNotContain",
  "equals",
  "doesNotEqual",
  "startsWith",
  "endsWith",
  "isEmpty",
  "isNotEmpty",
  "isAnyOf",
] as const;

export const DATE_FILTER_OPERATORS = [
  "is",
  "not",
  "after",
  "onOrAfter",
  "before",
  "onOrBefore",
  "isEmpty",
  "isNotEmpty",
] as const;
