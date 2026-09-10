import { notFound } from "next/navigation";

import { getSession } from "@/utils/session";

const AdminsLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getSession();

  if (session?.user?.role !== "admin") notFound();

  return children;
};

export default AdminsLayout;
