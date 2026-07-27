export const getHref = (
  pathname: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
) => {
  const search = new URLSearchParams(
    Object.entries(params)
      .map(([key, value]) => [key, String(value ?? "")])
      .filter(([, value]) => value),
  ).toString();

  return search ? `${pathname}?${search}` : pathname;
};
