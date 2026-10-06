import { chromium } from '@playwright/test';

/**
 * Executes an isolated programmatic test job against a target URL.
 * 
 * @param {Object} jobConfig
 * @param {string} jobConfig.url - Web application target
 * @param {string} [jobConfig.browserType='chromium'] - Browser target
 * @returns {Promise<Object>} Execution result summary
 */
export async function executeTestJob({ url, browserType = 'chromium' }) {
  const startTime = Date.now();
  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const title = await page.title();
    const status = response ? response.status() : 200;

    return {
      success: true,
      durationMs: Date.now() - startTime,
      title,
      status,
    };
  } catch (error) {
    return {
      success: false,
      durationMs: Date.now() - startTime,
      error: error.message,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
