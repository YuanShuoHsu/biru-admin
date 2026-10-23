import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

import { getIngredient } from "@/utils/inventory";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ ingredientId: string }>({
  resolveTarget: async ({ ingredientId }) => {
    const cookieStore = await cookies();

    const ingredient = await getIngredient(ingredientId, {
      headers: { cookie: cookieStore.toString() },
    });

    if (!ingredient) notFound();

    return {
      href: `/inventory/ingredients/${ingredientId}/audit-logs`,
      ingredient,
      resourceId: ingredientId,
    };
  },
  resource: "ingredient",
});
