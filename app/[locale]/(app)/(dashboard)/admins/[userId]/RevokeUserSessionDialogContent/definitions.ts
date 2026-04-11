import * as z from "zod";

export const revokeUserSessionFormSchema = z.object({
  userAgent: z.string(),
  ipAddress: z.string(),
});

export type RevokeUserSessionFormInput = z.input<
  typeof revokeUserSessionFormSchema
>;
