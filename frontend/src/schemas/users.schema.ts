import { z } from 'zod';

export const usersSchema = z.object({
  first_name: z.string(),

  middle_name: z.string(),

  last_name: z.string()
    .optional(),

  email: z.string().email(),

  phone_number: z.string()
    .optional(),

  password: z.string(),

  birth_date: z.date()
    .optional(),

  start_date: z.date()
    .optional(),

  gender: z.enum(['Мужчина', 'Женщина'] as const)
    .default('Мужчина'),

  address: z.string()
    .optional(),

  job_title: z.string()
    .optional(),

  last_login: z.date(),

  skills: z.array(z.string())
});

export type UsersFormData = z.infer<typeof usersSchema>;

export const validateUsers = (data: unknown): UsersFormData => {
  return usersSchema.parse(data);
};

