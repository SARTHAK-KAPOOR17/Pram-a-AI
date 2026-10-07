import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from './logger.js';

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts');
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');

/**
 * Ensures artifact storage directories exist.
 */
export async function ensureArtifactDirs() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  } catch (err) {
    logger.error('Failed to create artifact directory:', err.message);
  }
}

/**
 * Captures a full-page screenshot on test step failure and saves it to the artifacts directory.
 * Returns a client-accessible URL reference without storing binary buffers in MongoDB.
 *
 * @param {import('playwright').Page} page - Active Playwright page
 * @param {string} runId - Current TestRun ID
 * @param {number} stepOrder - Failing step sequence number
 * @returns {Promise<string|null>} Relative URL to screenshot artifact or null
 */
export async function captureFailureScreenshot(page, runId, stepOrder) {
  if (!page) return null;

  try {
    await ensureArtifactDirs();
    const filename = `${runId}_step_${stepOrder}_${Date.now()}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true,
      timeout: 5000,
    });

    return `/artifacts/screenshots/${filename}`;
  } catch (err) {
    logger.warn('Failed to capture failure screenshot:', err.message);
    return null;
  }
}
