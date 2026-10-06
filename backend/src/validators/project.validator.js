import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(2, 'Project name must be at least 2 characters')
      .max(100, 'Project name cannot exceed 100 characters'),
    description: z.string().trim().max(500).optional().default(''),
    baseUrl: z
      .string({ required_error: 'Base Application URL is required' })
      .trim()
      .min(1, 'Base URL is required'),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    baseUrl: z.string().trim().min(1).optional(),
    status: z.enum(['active', 'archived']).optional(),
  }),
});
