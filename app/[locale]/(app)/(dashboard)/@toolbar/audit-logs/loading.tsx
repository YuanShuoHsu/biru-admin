"use client";

import OrganizationSelectSkeleton from "@/components/OrganizationSelectSkeleton";

import { useSession } from "@/hooks/useSession";

const ToolbarAuditLogsLoading = () =>
  useSession()?.user.role === "admin" ? null : <OrganizationSelectSkeleton />;

export default ToolbarAuditLogsLoading;
