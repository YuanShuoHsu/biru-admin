"use client";

import { useState } from "react";
import useSWR from "swr";

import ItemsPanel from "./ItemsPanel";
import SectionPanel from "./SectionPanel";

import { Stack } from "@mui/material";

import type { AdminMenu, AdminMenuItem, AdminMenuSection } from "@/types/menus";

interface MenuDetailProps {
  menu: AdminMenu;
  initialSections: AdminMenuSection[];
  initialItems: AdminMenuItem[];
}

const MenuDetail = ({
  menu,
  initialSections,
  initialItems,
}: MenuDetailProps) => {
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );

  const { data: sections = initialSections, mutate: mutateSections } =
    useSWR<AdminMenuSection[]>(`/api/menus/${menu.id}/sections`, {
      fallbackData: initialSections,
    });

  const { data: items = initialItems, mutate: mutateItems } =
    useSWR<AdminMenuItem[]>(`/api/menus/${menu.id}/items`, {
      fallbackData: initialItems,
    });

  const handleMutate = () => {
    mutateSections();
    mutateItems();
  };

  return (
    <Stack direction="row" gap={2} flex={1} minHeight={0} overflow="hidden">
      <SectionPanel
        menuId={menu.id}
        sections={sections}
        selectedSectionId={selectedSectionId}
        onSelectSection={setSelectedSectionId}
        onMutate={handleMutate}
      />
      <ItemsPanel
        menuId={menu.id}
        sections={sections}
        items={items}
        selectedSectionId={selectedSectionId}
        onMutate={mutateItems}
      />
    </Stack>
  );
};

export default MenuDetail;
