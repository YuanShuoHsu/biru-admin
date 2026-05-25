import * as z from "zod";

export const useTeamFormSchema = () =>
  z.object({
    organizationId: z.string(),
  });

export type TeamForm = z.infer<ReturnType<typeof useTeamFormSchema>>;
