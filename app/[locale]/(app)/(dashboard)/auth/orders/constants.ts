export const getOrdersKey = (page: number, pageSize: number) =>
  `/api/users/me/orders?${new URLSearchParams({
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
  })}`;
