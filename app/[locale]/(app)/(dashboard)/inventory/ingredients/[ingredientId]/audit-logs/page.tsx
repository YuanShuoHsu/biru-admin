import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

import { isMissingResource, settle } from "@/utils/fetcher";
import { getIngredient } from "@/utils/inventory";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ ingredientId: string }>({
  resolveTarget: async ({ ingredientId }) => {
    const cookieStore = await cookies();

    const { data: ingredient, error } = await settle(
      getIngredient(ingredientId, {
        headers: { cookie: cookieStore.toString() },
      }),
    );
    if (isMissingResource(error)) notFound();
    if (error) throw error;

    return {
      href: `/inventory/ingredients/${ingredientId}/audit-logs`,
      ingredient,
      resourceId: ingredientId,
    };
  },
  resource: "ingredient",
});
