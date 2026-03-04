import { z } from 'zod';

export const projectSchema = z.object({
  project_name: z.string()
    .min(3, 'Название проекта должно содержать минимум 3 символа')
    .max(100, 'Название проекта не должно превышать 100 символов'),

  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional(),

  start_date: z.date()
    .default(new Date()),

  end_date: z.date(),

  status: z.enum(['В работе', 'Выполнена', 'Сдана', 'Провален',
    'Неактуально', 'Приостановлен', 'Черновик'] as const, {
    errorMap: () => ({ message: 'Некорректный статус проекта' })
  }),

  author_id: z.string(),

  tags: z.array(z.string())
    .optional(),

  created_at: z.date(),

  updated_at: z.date()
    .default(new Date()),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const validateProject = (data: unknown): ProjectFormData => {
  return projectSchema.parse(data);
}; 