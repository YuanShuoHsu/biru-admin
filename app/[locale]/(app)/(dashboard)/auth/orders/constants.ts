export const PAGE_SIZE_OPTIONS = [5, 10, 50, 100];

export const getOrdersKey = (page: number, pageSize: number) =>
  `/api/users/me/orders?${new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  })}`;
