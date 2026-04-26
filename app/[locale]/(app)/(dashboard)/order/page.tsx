import { setRequestLocale } from "next-intl/server";

import Order from ".";

import type { Locale } from "@/i18n/routing";

import type { OrderStatus } from "@/types/orders";

import { getOrders } from "@/utils/orders";

interface OrderPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}

const OrderPage = async ({ params, searchParams }: OrderPageProps) => {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);

  setRequestLocale(locale);

  const query = {
    page: Math.max(1, Number(sp.page) || 1),
    limit: Number(sp.limit) || 10,
    status: (sp.status || "") as OrderStatus | "",
    search: sp.search || "",
    sortBy: sp.sortBy || "createdAt",
    sortDir: (sp.sortDir || "desc") as "asc" | "desc",
  };

  const initialData = await getOrders(query);

  return <Order initialData={initialData} query={query} />;
};

export default OrderPage;
