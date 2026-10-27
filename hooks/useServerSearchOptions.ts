"use client";

import { type SyntheticEvent, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import type { AutocompleteInputChangeReason } from "@mui/material";
import { debounce } from "@mui/material/utils";

import { getGridSearchParams } from "@/utils/dataGrid";

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_PAGE_SIZE = 20;

export const useServerSearchOptions = <Option extends { id: string }>(
  path: string | null,
  selected: Option[],
) => {
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState("");

  const search = useMemo(() => debounce(setKeyword, SEARCH_DEBOUNCE_MS), []);

  useEffect(() => () => search.clear(), [search]);

  const params = getGridSearchParams({
    pageSize: SEARCH_PAGE_SIZE,
    filterField: "name",
    filterOperator: "contains",
    filterValue: keyword,
    sortBy: "name",
    sortDirection: "asc",
  });

  const { data, isLoading } = useSWR<{ data: Option[]; total: number }>(
    path && `${path}?${params.toString()}`,
    { keepPreviousData: true },
  );

  const selectedIds = new Set(selected.map(({ id }) => id));

  const onInputChange = (
    _event: SyntheticEvent,
    value: string,
    reason: AutocompleteInputChangeReason,
  ) => {
    if (reason === "input") {
      setInput(value.trim());
      search(value.trim());

      return;
    }

    search.clear();
    setInput("");
    setKeyword("");
  };

  return {
    loading: !!path && (input !== keyword || isLoading),
    onInputChange,
    options: [
      ...selected,
      ...(data?.data ?? []).filter(({ id }) => !selectedIds.has(id)),
    ],
  };
};
