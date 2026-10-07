import { z } from 'zod';

export const createTestRunSchema = z.object({
  body: z.object({
    testCaseId: z.string({ required_error: 'TestCase ID is required' }).trim().min(1),
    environmentId: z.string({ required_error: 'Environment ID is required' }).trim().min(1),
    browser: z.enum(['chromium', 'firefox', 'webkit']).optional().default('chromium'),
  }),
});
