export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_PAGINATION_QUERY = {
  page: String(DEFAULT_PAGE),
  pageSize: String(DEFAULT_PAGE_SIZE),
};

export const MAX_PAGE_SIZE = 100;

export const PAGE_SIZE_OPTIONS = [5, 10, 50, 100];

export const getPageSizeOptions = (pageSize: number) =>
  [...new Set([...PAGE_SIZE_OPTIONS, pageSize])].sort((a, b) => a - b);

const toBoundedInt = (
  raw: string | string[] | undefined,
  fallback: number,
  max: number,
) => {
  const value = Math.floor(Number(raw));
  if (!Number.isSafeInteger(value) || value < 1) return fallback;

  return Math.min(value, max);
};

export const resolvePagination = (
  rawPage: string | string[] | undefined,
  rawPageSize: string | string[] | undefined,
) => {
  const pageSize = toBoundedInt(rawPageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  // API 的 offset 上限是 Number.MAX_SAFE_INTEGER，超過會回 400
  const maxPage = Math.floor(Number.MAX_SAFE_INTEGER / pageSize) + 1;

  return { page: toBoundedInt(rawPage, DEFAULT_PAGE, maxPage), pageSize };
};
