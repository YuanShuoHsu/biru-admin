export const getPointsKey = (page: number, pageSize: number) =>
  `/api/users/me/points?${new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  })}`;
