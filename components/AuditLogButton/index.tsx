"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { Link, usePathname } from "@/i18n/navigation";

import { History } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

import { getHref } from "@/utils/href";

interface AuditLogButtonProps {
  resourceId: string;
}

const AuditLogButton = ({ resourceId }: AuditLogButtonProps) => {
  const pathname = usePathname();

  const searchParams = useSearchParams();

  const tAudit = useTranslations("audit");

  return (
    <Tooltip title={tAudit("title")}>
      <IconButton
        component={Link}
        href={getHref(`${pathname}/${resourceId}/audit-logs`, {
          ...DEFAULT_PAGINATION_QUERY,
          organization: searchParams.get("organization"),
        })}
        size="small"
      >
        <History fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default AuditLogButton;
