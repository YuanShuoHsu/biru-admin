export const getHref = (
  pathname: string,
  params: Record<string, string | number | boolean | undefined | null>,
) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, String(value));
  });

  const search = searchParams.toString();
  const query = search ? `?${search}` : "";
  const href = `${pathname}${query}`;

  return href;
};
