import * as z from "zod";

export const useLocationFormSchema = () =>
  z.object({
    organizationId: z.string(),
  });

export type LocationForm = z.infer<ReturnType<typeof useLocationFormSchema>>;
