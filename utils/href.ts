import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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

export const movedPage =
  (pathname: string) =>
  async ({
    params,
    searchParams,
  }: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }) => {
    const [{ locale }, query] = await Promise.all([params, searchParams]);

    const redirectParams = new URLSearchParams();

    for (const [key, value] of Object.entries(query))
      for (const item of [value ?? []].flat()) redirectParams.append(key, item);

    redirect({ href: `${pathname}?${redirectParams.toString()}`, locale });
  };
