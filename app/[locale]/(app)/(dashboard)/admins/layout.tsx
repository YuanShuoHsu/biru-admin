import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { authClient } from "@/lib/auth-client";

const AdminsLayout = async ({ children }: { children: React.ReactNode }) => {
  const cookieStore = await cookies();

  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: cookieStore.toString(),
        origin: process.env.NEXT_PUBLIC_NEXT_URL!,
      },
    },
  });

  if (session?.user?.role !== "admin") notFound();

  return children;
};

export default AdminsLayout;
