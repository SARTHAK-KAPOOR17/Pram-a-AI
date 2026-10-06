import { z } from 'zod';

const locatorValidationSchema = z.object({
  strategy: z.enum(['css', 'xpath', 'id', 'text', 'role', 'testid'], {
    errorMap: () => ({ message: 'Locator strategy must be css, xpath, id, text, role, or testid' }),
  }),
  value: z.string().trim().min(1, 'Locator value cannot be empty'),
  domFingerprint: z.string().nullable().optional(),
  elementText: z.string().nullable().optional(),
  elementRole: z.string().nullable().optional(),
  elementAttributes: z.record(z.any()).nullable().optional(),
});

const assertionValidationSchema = z.object({
  type: z.enum([
    'visible',
    'hidden',
    'text_contains',
    'text_equals',
    'url_contains',
    'url_equals',
    'enabled',
    'disabled',
  ]),
  locator: locatorValidationSchema.nullable().optional(),
  expectedValue: z.string().nullable().optional(),
});

const testStepValidationSchema = z.object({
  order: z.number().int().min(1, 'Step order must be a positive integer'),
  action: z.enum([
    'navigate',
    'click',
    'fill',
    'select',
    'check',
    'uncheck',
    'hover',
    'press',
    'wait',
    'assert',
  ]),
  locator: locatorValidationSchema.nullable().optional(),
  value: z.string().nullable().optional(),
  assertion: assertionValidationSchema.nullable().optional(),
  description: z.string().nullable().optional(),
});

export const createTestCaseSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Test case name is required' })
      .trim()
      .min(2, 'Test case name must be at least 2 characters')
      .max(150, 'Test case name cannot exceed 150 characters'),
    description: z.string().trim().optional().default(''),
    suiteId: z.string().trim().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
    status: z.enum(['active', 'draft', 'deprecated', 'flaky']).optional().default('draft'),
    tags: z.array(z.string().trim()).optional().default([]),
    steps: z.array(testStepValidationSchema).optional().default([]),
  }),
});

export const updateTestCaseSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().optional(),
    suiteId: z.string().trim().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    status: z.enum(['active', 'draft', 'deprecated', 'flaky']).optional(),
    tags: z.array(z.string().trim()).optional(),
    steps: z.array(testStepValidationSchema).optional(),
  }),
});
