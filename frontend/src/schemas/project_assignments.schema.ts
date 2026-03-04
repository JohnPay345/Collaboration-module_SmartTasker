import { z } from 'zod';

export const projectAssignmentsSchema = z.object({
  project_id: z.string(),
  user_id: z.string()
});

export type ProjectAssignmentsFormData = z.infer<typeof projectAssignmentsSchema>;

export const validateProjectAssignments =
  (data: unknown): ProjectAssignmentsFormData => {
    return projectAssignmentsSchema.parse(data);
  };

