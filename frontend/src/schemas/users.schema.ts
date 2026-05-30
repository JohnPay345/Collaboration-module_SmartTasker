import { z } from 'zod';

export const usersSchema = z.object({
  first_name: z.string(),

  middle_name: z.string(),

  last_name: z.string()
    .optional(),

  email: z.string().email()
    .regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i, 'Некорректный формат email'),

  phone_number: z.string()
    .regex(/^[0-9+\-()\s]*$/, 'Телефон может содержать только цифры, +, -, пробелы и скобки')
    .optional(),

  birth_date: z.date()
    .optional(),

  start_date: z.date()
    .optional(),

  gender: z.enum(['Мужчина', 'Женщина'] as const)
    .default('Мужчина'),

  lastVisit: z.date(),

  address: z.string()
    .optional(),

  job_title: z.string()
    .optional(),

  avatarpath: z.string(),

  last_login: z.string()
    .optional(),

  skills: z.string()
});

export type UsersFormData = z.infer<typeof usersSchema>;

export const validateUsers = (data: unknown): UsersFormData => {
  return usersSchema.parse(data);
};

