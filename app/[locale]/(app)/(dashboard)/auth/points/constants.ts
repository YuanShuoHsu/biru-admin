export const PAGE_SIZE_OPTIONS = [5, 10, 50, 100];

export const getPointsKey = (page: number, pageSize: number) =>
  `/api/users/me/points?${new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  })}`;
