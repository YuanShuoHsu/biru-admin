import { useTranslations } from "next-intl";
import * as z from "zod";

import type { OrderMenuItem, OrderMenuModifierGroup } from "@/types/menus";

import { ADD_ON_OPTION_ID, getAddOnItems } from "@/utils/menus";

export const useAddToCartFormSchema = (menuItem: OrderMenuItem) => {
  const tOrder = useTranslations("order");

  const getGroupMessage = (
    { minSelectionCount, maxSelectionCount }: OrderMenuModifierGroup,
    selected: string[],
  ) =>
    selected.length < minSelectionCount
      ? tOrder("menuItem.selectAtLeast", { count: minSelectionCount })
      : maxSelectionCount != null && selected.length > maxSelectionCount
        ? tOrder("menuItem.selectUpTo", { count: maxSelectionCount })
        : null;

  return z
    .object({
      quantity: z.number(),
      choices: z.record(z.string(), z.array(z.string())),
      addOnChoices: z.record(
        z.string(),
        z.record(z.string(), z.array(z.string())),
      ),
    })
    .superRefine(({ choices, addOnChoices }, ctx) => {
      menuItem.modifierGroups.forEach((group) => {
        const message = getGroupMessage(group, choices[group.id] ?? []);

        if (message)
          ctx.addIssue({
            code: "custom",
            message,
            path: ["choices", group.id],
          });
      });

      const selectedAddOnIds = choices[ADD_ON_OPTION_ID] ?? [];

      getAddOnItems(menuItem)
        .filter(({ id }) => selectedAddOnIds.includes(id))
        .forEach(({ id: addOnId, modifierGroups }) =>
          modifierGroups.forEach((group) => {
            const message = getGroupMessage(
              group,
              addOnChoices[addOnId]?.[group.id] ?? [],
            );

            if (message)
              ctx.addIssue({
                code: "custom",
                message,
                path: ["addOnChoices", addOnId, group.id],
              });
          }),
        );
    });
};

export type AddToCartFormInput = z.input<
  ReturnType<typeof useAddToCartFormSchema>
>;

export type AddToCartFormOutput = z.output<
  ReturnType<typeof useAddToCartFormSchema>
>;
