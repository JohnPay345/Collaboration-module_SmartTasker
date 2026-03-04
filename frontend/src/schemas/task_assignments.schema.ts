import { z } from 'zod';

export const taskAssignmentsSchema = z.object({
  task_id: z.string(),
  user_id: z.string(),
  assigned_at: z.date()
    .default(new Date()),
  is_completed: z.boolean()
    .default(false),
  completed_at: z.date()
});

export type TaskAssignmentsFormData = z.infer<typeof taskAssignmentsSchema>;

export const validateTaskAssignments =
  (data: unknown): TaskAssignmentsFormData => {
    return taskAssignmentsSchema.parse(data);
  };

