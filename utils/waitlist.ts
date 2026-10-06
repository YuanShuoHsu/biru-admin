import { waitlistErrorCodeValues } from "@/types/api";
import type { WaitlistErrorCode } from "@/types/waitlist";

import type { FetchError } from "@/utils/fetcher";

export const getWaitlistErrorCode = (
  error: unknown,
): WaitlistErrorCode | undefined => {
  const code = (error as FetchError)?.info?.message;

  return waitlistErrorCodeValues.find((value) => value === code);
};
