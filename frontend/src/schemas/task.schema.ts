import { z } from 'zod';

export const taskSchema = z.object({
  task_name: z.string()
    .min(3, 'Название задачи должно содержать минимум 3 символа')
    .max(100, 'Название задачи не должно превышать 100 символов'),

  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional(),

  author_id: z.string(),

  project_id: z.string()
    .optional(),

  goal_id: z.string()
    .optional(),

  start_date: z.date(),

  end_date: z.date(),

  status: z.enum(['Новая', 'В работе', 'Завершена', 'Отложена'], {
    errorMap: () => ({ message: 'Некорректный статус задачи' })
  }),

  is_urgent: z.boolean(),

  priority: z.enum(['Низкий', 'Средний', 'Высокий'], {
    errorMap: () => ({ message: 'Некорректный приоритет' })
  }),

  value: z.enum(['1', '2', '3', '4', '5']),

  effort: z.enum(['1', '2', '3', '4', '5']),

  esstimated_duration: z.number(),

  priority_asement: z.number(),

  qualification_assessment: z.number(),

  load_assessment: z.number(),

  required_skills: z.array(z.string())
    .optional()
});

export type TaskFormData = z.infer<typeof taskSchema>;

export const validateTask = (data: unknown): TaskFormData => {
  return taskSchema.parse(data);
}; 