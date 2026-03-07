import { ORDER_MODE } from "@/constants/orderMode";

export type OrderMode = (typeof ORDER_MODE)[keyof typeof ORDER_MODE];
