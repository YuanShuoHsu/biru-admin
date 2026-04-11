import * as z from "zod";

export const revokeUserSessionFormSchema = z.object({
  ipAddress: z.string(),
  userAgent: z.string(),
});

export type RevokeUserSessionFormInput = z.input<
  typeof revokeUserSessionFormSchema
>;
