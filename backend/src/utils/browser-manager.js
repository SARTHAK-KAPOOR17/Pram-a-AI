import { chromium } from 'playwright';
import { logger } from './logger.js';

/**
 * Pramāṇa AI — Browser Manager
 *
 * Provides a clean browser lifecycle abstraction that guarantees resource cleanup.
 * Prevents zombie browser processes and resource leaks across failed, timed-out,
 * or successful executions.
 *
 * @param {object} [options={}] - Browser launch and context options
 * @param {boolean} [options.headless=true] - Run headless
 * @param {object} [options.viewport] - Browser viewport
 * @param {Function} callback - Execution callback receiving { browser, context, page }
 * @returns {Promise<any>} Result returned by callback
 */
export async function withBrowserSession(options = {}, callback) {
  let browser = null;
  let context = null;
  let page = null;

  try {
    browser = await chromium.launch({
      headless: options.headless !== false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    context = await browser.newContext({
      viewport: options.viewport || { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });

    page = await context.newPage();

    return await callback({ browser, context, page });
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        logger.warn('Failed to close page:', err.message);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (err) {
        logger.warn('Failed to close context:', err.message);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        logger.warn('Failed to close browser:', err.message);
      }
    }
  }
}
