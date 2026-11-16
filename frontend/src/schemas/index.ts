import { z } from 'zod';
import { CATEGORIES, PRIORITIES } from '../types';

// Messages are i18n keys; forms translate them with t().
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'validation.required').email('validation.emailInvalid'),
  password: z.string().min(1, 'validation.required'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'validation.nameMin'),
    email: z.string().trim().min(1, 'validation.required').email('validation.emailInvalid'),
    password: z.string().min(8, 'validation.passwordMin'),
    confirmPassword: z.string().min(1, 'validation.required'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'validation.passwordMismatch',
  });
export type RegisterForm = z.infer<typeof registerSchema>;

export const ticketSchema = z.object({
  title: z.string().trim().min(3, 'validation.titleMin').max(120, 'validation.titleMax'),
  description: z.string().trim().min(10, 'validation.descriptionMin'),
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
});
export type TicketForm = z.infer<typeof ticketSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'validation.commentRequired'),
  internal: z.boolean(),
});
export type CommentForm = z.infer<typeof commentSchema>;
