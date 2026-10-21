import { SWRConfig } from "swr";

import AttendanceTabs from "../AttendanceTabs";

import { getDefaultMemberRoleFallback } from "@/utils/session";

const AttendanceLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <>
    <SWRConfig value={{ fallback: await getDefaultMemberRoleFallback() }}>
      <AttendanceTabs />
    </SWRConfig>
    {children}
  </>
);

export default AttendanceLayout;
