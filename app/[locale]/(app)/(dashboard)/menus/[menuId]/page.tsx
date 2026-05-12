import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MenusMenuId from ".";
import {
  FILTER_FIELDS,
  FILTER_OPERATORS,
  NO_VALUE_FILTER_OPERATORS,
  SORT_BY_FIELDS,
  SORT_DIRECTIONS,
} from "./constants";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getAdminMenu, getAdminMenuSections } from "@/utils/menus";

interface MenusMenuIdPageProps {
  params: Promise<{ locale: Locale; menuId: string }>;
  searchParams: Promise<{
    filterField?: string;
    filterOperator?: string;
    filterValue?: string;
    organization?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortDirection?: string;
  }>;
}

const MenusMenuIdPage = async ({
  params,
  searchParams,
}: MenusMenuIdPageProps) => {
  const [
    cookieStore,
    { locale, menuId },
    {
      filterField: rawFilterField,
      filterOperator: rawFilterOperator,
      filterValue,
      // searchField: rawSearchField,
      // searchOperator: rawSearchOperator,
      // searchValue,
      page: rawPage,
      pageSize: rawPageSize,
      sortBy: rawSortBy,
      sortDirection: rawSortDirection,
      ...restSearchParams
    },
  ] = await Promise.all([cookies(), params, searchParams]);

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || 10);

  const sortBy = SORT_BY_FIELDS.find((field) => field === rawSortBy);
  const sortDirection = SORT_DIRECTIONS.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = FILTER_FIELDS.find((field) => field === rawFilterField);
  const filterOperator = FILTER_OPERATORS.find(
    (operator) => operator === rawFilterOperator,
  );

  // const searchField = SEARCH_FIELDS.find((field) => field === rawSearchField);
  // const searchOperator = SEARCH_OPERATORS.find(
  //   (operator) => operator === rawSearchOperator,
  // );

  if (
    rawPage !== String(page) ||
    rawPageSize !== String(pageSize) ||
    rawSortBy !== sortBy ||
    rawSortDirection !== sortDirection ||
    !!sortBy !== !!sortDirection ||
    rawFilterField !== filterField ||
    rawFilterOperator !== filterOperator ||
    !!(filterField || filterOperator || filterValue) !==
      !!(
        filterField &&
        filterOperator &&
        (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator))
      )
    // ||
    // rawSearchField !== searchField ||
    // rawSearchOperator !== searchOperator ||
    // !!(searchField || searchOperator || searchValue) !==
    //   !!(searchField && searchOperator && searchValue)
  ) {
    const params = new URLSearchParams({
      ...restSearchParams,
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(filterField &&
        filterOperator &&
        filterValue && { filterField, filterOperator, filterValue }),
      // ...(searchField &&
      //   searchOperator &&
      //   searchValue && { searchField, searchOperator, searchValue }),
    });
    redirect({
      href: `/menus/${menuId}?${params.toString()}`,
      locale,
    });
  }

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };
  const [menu, { sections, total }] = await Promise.all([
    getAdminMenu(menuId, fetchOptions),
    getAdminMenuSections(
      menuId,
      page,
      pageSize,
      filterField,
      filterOperator,
      filterValue,
      sortBy,
      sortDirection,
      fetchOptions,
    ),
  ]);

  if (!menu) notFound();

  return (
    <MenusMenuId
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      menu={menu}
      page={page}
      pageSize={pageSize}
      rowCount={total}
      // searchField={searchField}
      // searchOperator={searchOperator}
      // searchValue={searchValue}
      sections={sections}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default MenusMenuIdPage;
