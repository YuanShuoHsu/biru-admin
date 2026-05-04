"use client";

import useSWR from "swr";

import ItemsPanel from "./ItemsPanel";

import { Stack } from "@mui/material";

import { useRouter } from "@/i18n/navigation";

import type { AdminMenuItem, AdminMenuSection } from "@/types/menus";

interface MenusMenuIdSectionIdItemsProps {
  menuId: string;
  sectionId: string;
  initialSections: AdminMenuSection[];
  initialItems: AdminMenuItem[];
}

const MenusMenuIdSectionIdItems = ({
  menuId,
  sectionId,
  initialSections,
  initialItems,
}: MenusMenuIdSectionIdItemsProps) => {
  const router = useRouter();

  const { data: sections = initialSections } = useSWR<AdminMenuSection[]>(
    `/api/menus/${menuId}/sections`,
    {
      fallbackData: initialSections,
    },
  );

  const { data: items = initialItems, mutate: mutateItems } = useSWR<
    AdminMenuItem[]
  >(`/api/menu-sections/${sectionId}/items`, {
    fallbackData: initialItems,
  });

  return (
    <Stack gap={2} flex={1} minHeight={0} overflow="hidden">
      <ItemsPanel
        sections={sections}
        items={items}
        selectedSectionId={sectionId}
        onBack={() => router.push(`/menus/${menuId}`)}
        onMutate={mutateItems}
      />
    </Stack>
  );
};

export default MenusMenuIdSectionIdItems;
