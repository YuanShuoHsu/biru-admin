import { ORDER_MODE } from "@/constants/orderMode";

import type { components } from "@/types/api";

export type OrderMode = (typeof ORDER_MODE)[keyof typeof ORDER_MODE];
export type ApiOrderMode = components["schemas"]["OrderMode"];
