export const DEFAULT_PAGE_SIZE = 10;

export const DEFAULT_PAGINATION_QUERY = {
  page: "1",
  pageSize: String(DEFAULT_PAGE_SIZE),
};

export const PAGE_SIZE_OPTIONS = [5, 10, 50, 100];

export const getPageSizeOptions = (pageSize: number) =>
  [...new Set([...PAGE_SIZE_OPTIONS, pageSize])].sort((a, b) => a - b);
