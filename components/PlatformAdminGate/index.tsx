"use client";

import { notFound } from "next/navigation";

import { useSession } from "@/hooks/useSession";

const PlatformAdminGate = () => {
  if (useSession()?.user.role !== "admin") notFound();

  return null;
};

export default PlatformAdminGate;
