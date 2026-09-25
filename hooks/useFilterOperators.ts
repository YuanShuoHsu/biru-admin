import { useTranslations } from "next-intl";
import { useMemo } from "react";

import DateFilterInputValue, {
  type DateFilterInputValueProps,
} from "@/components/DateFilterInputValue";
import DurationFilterInputValue from "@/components/DurationFilterInputValue";

import {
  DATE_FILTER_OPERATORS,
  ENUM_FILTER_OPERATORS,
  NO_VALUE_FILTER_OPERATORS,
  NUMBER_FILTER_OPERATORS,
  STRING_FILTER_OPERATORS,
} from "@/constants/dataGrid";

import { useMonthFormat } from "@/hooks/useMonthFormat";

import type {
  GridFilterInputValueProps,
  GridFilterOperator,
  GridValidRowModel,
} from "@mui/x-data-grid";
import {
  GridFilterInputBoolean,
  GridFilterInputMultipleSingleSelect,
  GridFilterInputMultipleValue,
  GridFilterInputSingleSelect,
  GridFilterInputValue,
} from "@mui/x-data-grid";

export const useStringFilterOperators = () => {
  const tToolbar = useTranslations("dataGrid.toolbar");

  return useMemo<GridFilterOperator[]>(
    () =>
      STRING_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { InputComponent: undefined }
          : value === "isAnyOf"
            ? { InputComponent: GridFilterInputMultipleValue }
            : { InputComponent: GridFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );
};

export const useEnumFilterOperators = () => {
  const tToolbar = useTranslations("dataGrid.toolbar");

  return useMemo<GridFilterOperator[]>(
    () =>
      ENUM_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        InputComponent:
          value === "isAnyOf"
            ? GridFilterInputMultipleSingleSelect
            : GridFilterInputSingleSelect,
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );
};

export const useDateFilterOperators = () => {
  const tToolbar = useTranslations("dataGrid.toolbar");

  return useMemo<GridFilterOperator[]>(
    () =>
      DATE_FILTER_OPERATORS.map((value) => ({
        getApplyFilterFn: () => null,
        ...(NO_VALUE_FILTER_OPERATORS.includes(value)
          ? { InputComponent: undefined }
          : { InputComponent: DateFilterInputValue }),
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [tToolbar],
  );
};

export const useMonthFilterOperators = () => {
  const monthFormat = useMonthFormat();

  const tToolbar = useTranslations("dataGrid.toolbar");

  return useMemo<
    GridFilterOperator<
      GridValidRowModel,
      string,
      string,
      DateFilterInputValueProps
    >[]
  >(
    () =>
      DATE_FILTER_OPERATORS.filter(
        (value) => !NO_VALUE_FILTER_OPERATORS.includes(value),
      ).map((value) => ({
        getApplyFilterFn: () => null,
        InputComponent: DateFilterInputValue,
        InputComponentProps: {
          format: monthFormat,
          valueFormat: "YYYY-MM",
          views: ["year", "month"],
        },
        label: tToolbar(`filter.operator.${value}`),
        value,
      })),
    [monthFormat, tToolbar],
  );
};

export const useNumberFilterOperators = () => {
  const tToolbar = useTranslations("dataGrid.toolbar");

  return useMemo<
    GridFilterOperator<
      GridValidRowModel,
      number | string | null,
      number | string | null,
      GridFilterInputValueProps & { type?: "number" }
    >[]
  >(
    () =>
      NUMBER_FILTER_OPERATORS.map((value) =>
        value === "isEmpty" || value === "isNotEmpty" || value === "isAnyOf"
          ? {
              getApplyFilterFn: () => null,
              ...(value === "isAnyOf"
                ? {
                    InputComponent: GridFilterInputMultipleValue,
                    InputComponentProps: { type: "number" as const },
                  }
                : { InputComponent: undefined }),
              label: tToolbar(`filter.operator.${value}`),
              value,
            }
          : {
              getApplyFilterFn: () => null,
              InputComponent: GridFilterInputValue,
              InputComponentProps: { type: "number" as const },
              label: value,
              value,
            },
      ),
    [tToolbar],
  );
};

export const useDurationFilterOperators = () =>
  useMemo<GridFilterOperator[]>(
    () =>
      NUMBER_FILTER_OPERATORS.filter(
        (value) =>
          !NO_VALUE_FILTER_OPERATORS.includes(value) && value !== "isAnyOf",
      ).map((value) => ({
        getApplyFilterFn: () => null,
        InputComponent: DurationFilterInputValue,
        label: value,
        value,
      })),
    [],
  );

export const useBooleanFilterOperators = () => {
  const tToolbar = useTranslations("dataGrid.toolbar");

  return useMemo<GridFilterOperator<GridValidRowModel, boolean | null>[]>(
    () => [
      {
        getApplyFilterFn: () => null,
        InputComponent: GridFilterInputBoolean,
        label: tToolbar("filter.operator.is"),
        value: "is",
      },
    ],
    [tToolbar],
  );
};
