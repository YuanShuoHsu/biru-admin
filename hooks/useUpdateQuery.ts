import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

export const useUpdateQuery = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(
    (values: Record<string, string>) => {
      const params = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(values)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );
};
