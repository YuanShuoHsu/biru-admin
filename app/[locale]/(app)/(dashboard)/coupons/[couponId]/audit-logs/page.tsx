import {
  createAuditLogsPage,
  generateAuditLogsMetadata,
} from "@/components/AuditLogsPage";

export const generateMetadata = generateAuditLogsMetadata;

export default createAuditLogsPage<{ couponId: string }>({
  adminScope: true,
  resolveTarget: ({ couponId }) => ({
    ancestorId: couponId,
    href: `/coupons/${couponId}/audit-logs`,
  }),
  resource: "userCoupon",
});
