"use client";

import useSWR from "swr";

import SectionPanel from "./SectionPanel";

import { Stack } from "@mui/material";

import type { AdminMenu, AdminMenuSection } from "@/types/menus";

interface MenuDetailProps {
  menu: AdminMenu;
  initialSections: AdminMenuSection[];
}

const MenuId = ({ menu, initialSections }: MenuDetailProps) => {
  const { data: sections = initialSections, mutate: mutateSections } = useSWR<
    AdminMenuSection[]
  >(`/api/menus/${menu.id}/sections`, {
    fallbackData: initialSections,
  });

  return (
    <Stack gap={2} flex={1} minHeight={0} overflow="hidden">
      <SectionPanel
        menuId={menu.id}
        sections={sections}
        onMutate={mutateSections}
      />
    </Stack>
  );
};

export default MenuId;
