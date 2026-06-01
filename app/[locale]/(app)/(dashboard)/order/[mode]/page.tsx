import { notFound } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";

interface OrderModePageProps {
  params: Promise<{ mode: string }>;
}

const OrderModePage = async ({ params }: OrderModePageProps) => {
  const { mode } = await params;

  const validModes: string[] = Object.values(ORDER_MODE);
  if (!validModes.includes(mode)) return notFound();

  return null;
};

export default OrderModePage;
