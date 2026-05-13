"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Extension, LocalOffer } from "@mui/icons-material";
import { Box, Tab, Tabs } from "@mui/material";

const MenuItemLayout = ({ children }: { children: React.ReactNode }) => {
  const { menuId, menuSectionId, menuItemId } = useParams<{
    menuId: string;
    menuSectionId: string;
    menuItemId: string;
  }>();

  const pathname = usePathname();
  const router = useRouter();
  const tMenus = useTranslations("menus");

  const basePath = `/menus/${menuId}/${menuSectionId}/${menuItemId}`;
  const activeTab = pathname.startsWith(`${basePath}/add-ons`)
    ? "add-ons"
    : "offers";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Tabs
        value={activeTab}
        onChange={(_, value) => router.push(`${basePath}/${value}`)}
      >
        <Tab
          icon={<LocalOffer fontSize="small" />}
          iconPosition="start"
          label={tMenus("offers.label")}
          value="offers"
        />
        <Tab
          icon={<Extension fontSize="small" />}
          iconPosition="start"
          label={tMenus("addOns.label")}
          value="add-ons"
        />
      </Tabs>
      {children}
    </Box>
  );
};

export default MenuItemLayout;
