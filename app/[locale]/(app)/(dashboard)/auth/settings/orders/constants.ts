export const PAGE_SIZE = 10;

export const getOrdersKey = (page: number) =>
  `/api/users/me/orders?${new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String((page - 1) * PAGE_SIZE),
  })}`;
