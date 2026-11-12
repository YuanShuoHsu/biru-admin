"use client";

import { useTranslations } from "next-intl";

import { ErrorOutlined } from "@mui/icons-material";
import { Badge } from "@mui/material";

import type { NavBadge } from "@/types/navItem";

interface NavItemBadgeProps {
  badge?: NavBadge;
  children: React.ReactNode;
}

const NavItemBadge = ({ badge, children }: NavItemBadgeProps) => {
  const tCommon = useTranslations("common");

  return (
    <Badge
      badgeContent={
        badge === "error" ? (
          <ErrorOutlined
            fontSize="inherit"
            titleAccess={tCommon("error.title")}
          />
        ) : (
          badge
        )
      }
      color="error"
    >
      {children}
    </Badge>
  );
};

export default NavItemBadge;
