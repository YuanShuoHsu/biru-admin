import type { ChipProps } from "@mui/material";

import type { WaitlistTicketStatus } from "@/types/waitlist";

export const WAITLIST_STATUS_COLORS: Record<
  WaitlistTicketStatus,
  ChipProps["color"]
> = {
  called: "success",
  cancelled: "default",
  noShow: "error",
  seated: "primary",
  waiting: "warning",
};
