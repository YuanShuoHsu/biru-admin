"use client";

import { useTranslations } from "next-intl";

import { ErrorOutlined } from "@mui/icons-material";
import { Chip } from "@mui/material";

import type { NavBadge } from "@/types/navItem";

const NavItemChip = ({ badge }: { badge?: NavBadge }) => {
  const tCommon = useTranslations("common");

  return (
    !!badge && (
      <Chip
        color={badge === "error" ? "error" : "secondary"}
        label={
          badge === "error" ? (
            <ErrorOutlined
              fontSize="inherit"
              titleAccess={tCommon("error.title")}
            />
          ) : (
            badge
          )
        }
        size="small"
      />
    )
  );
};

export default NavItemChip;
