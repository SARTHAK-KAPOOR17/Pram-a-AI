import { z } from 'zod';

export const createSuiteSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Suite name is required' })
      .trim()
      .min(2, 'Suite name must be at least 2 characters')
      .max(100, 'Suite name cannot exceed 100 characters'),
    description: z.string().trim().max(500).optional().default(''),
    tags: z.array(z.string().trim()).optional().default([]),
  }),
});

export const updateSuiteSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    tags: z.array(z.string().trim()).optional(),
  }),
});
