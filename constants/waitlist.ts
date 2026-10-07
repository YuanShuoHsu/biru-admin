import { blue, green, orange, purple, red, yellow } from "@mui/material/colors";
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

export const WAITLIST_GROUP_COLORS = [
  red[600],
  orange[600],
  yellow[600],
  green[600],
  blue[600],
  purple[600],
];
