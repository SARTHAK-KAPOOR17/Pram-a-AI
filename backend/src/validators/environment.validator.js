import { z } from 'zod';

const variableItemSchema = z.object({
  key: z.string().trim().min(1, 'Variable key is required'),
  value: z.string().default(''),
  isSecret: z.boolean().default(false),
});

export const createEnvironmentSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Environment name is required' })
      .trim()
      .min(1, 'Environment name cannot be empty')
      .max(50, 'Environment name cannot exceed 50 characters'),
    baseUrl: z
      .string({ required_error: 'Base URL is required' })
      .trim()
      .min(1, 'Base URL is required'),
    variables: z.array(variableItemSchema).optional().default([]),
    isDefault: z.boolean().optional().default(false),
  }),
});

export const updateEnvironmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    baseUrl: z.string().trim().min(1).optional(),
    variables: z.array(variableItemSchema).optional(),
    isDefault: z.boolean().optional(),
  }),
});
