import { notFound } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";

interface OrderModePageProps {
  params: Promise<{ mode: string }>;
}

const OrderModePage = async ({ params }: OrderModePageProps) => {
  const { mode } = await params;

  if (mode !== ORDER_MODE.Pickup) return notFound();

  return null;
};

export default OrderModePage;
