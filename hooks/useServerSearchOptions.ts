"use client";

import { type SyntheticEvent, useEffect, useState } from "react";
import useSWR from "swr";

import type { AutocompleteInputChangeReason } from "@mui/material";

import { getGridSearchParams } from "@/utils/dataGrid";

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_PAGE_SIZE = 20;

export const useServerSearchOptions = <
  Option extends { id: string; name: unknown },
>(
  path: string | null,
  selected: readonly Option[],
) => {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedKeyword(keyword),
      SEARCH_DEBOUNCE_MS,
    );

    return () => clearTimeout(timer);
  }, [keyword]);

  const params = getGridSearchParams({
    pageSize: SEARCH_PAGE_SIZE,
    filterField: "name",
    filterOperator: "contains",
    filterValue: debouncedKeyword,
    sortBy: "name",
    sortDirection: "asc",
  });

  const { data, isLoading } = useSWR<{ data: Option[]; total: number }>(
    path && open ? `${path}?${params.toString()}` : null,
    { keepPreviousData: true },
  );

  const selectedIds = new Set(selected.map(({ id }) => id));

  return {
    filterOptions: (options: Option[]) => options,
    loading: open && (keyword !== debouncedKeyword || isLoading),
    onClose: () => setOpen(false),
    onInputChange: (
      _event: SyntheticEvent,
      value: string,
      reason: AutocompleteInputChangeReason,
    ) => {
      const nextKeyword = reason === "input" ? value.trim() : "";

      setKeyword(nextKeyword);
      if (!nextKeyword) setDebouncedKeyword("");
    },
    onOpen: () => setOpen(true),
    open,
    options: [
      ...selected,
      ...(data?.data ?? []).filter(({ id }) => !selectedIds.has(id)),
    ],
  };
};
