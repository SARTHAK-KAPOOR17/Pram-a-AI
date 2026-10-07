import { chromium, firefox, webkit } from 'playwright';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { logger } from './logger.js';
import { saveTrace, saveVideo } from './artifact-manager.js';

/**
 * Pramāṇa AI — Browser Manager (Phase 3B Multi-Browser & Observability Lifecycle)
 *
 * Provides resource-safe browser lifecycle management with integrated:
 * - Browser matrix: Chromium, Firefox, WebKit
 * - Playwright Tracing (screenshots, snapshots, sources)
 * - Video recording
 * - Console logs capture
 * - Network activity capture
 * - Guaranteed teardown in finally blocks to prevent zombie processes
 *
 * @param {object} [options={}] - Browser session configuration
 * @param {string} [options.browser='chromium'] - Browser engine: 'chromium' | 'firefox' | 'webkit'
 * @param {string} [options.runId] - Unique test run identifier
 * @param {boolean} [options.headless=true] - Run headless
 * @param {boolean} [options.enableTracing=true] - Enable Playwright tracing
 * @param {boolean} [options.enableVideo=true] - Enable video recording
 * @param {object} [options.viewport] - Viewport dimensions (default 1280x720)
 * @param {Function} callback - Execution callback receiving { browser, context, page, consoleLogs, networkLogs }
 * @returns {Promise<any>} Result returned by callback
 */
export async function withBrowserSession(options = {}, callback) {
  const browserType = (options.browser || 'chromium').toLowerCase();
  const runId = options.runId || `run_${Date.now()}`;
  const enableTracing = options.enableTracing !== false;
  const enableVideo = options.enableVideo !== false;

  let launcher = chromium;
  if (browserType === 'firefox') {
    launcher = firefox;
  } else if (browserType === 'webkit') {
    launcher = webkit;
  }

  let browser = null;
  let context = null;
  let page = null;
  let tempVideoDir = null;
  let videoArtifactUrl = null;
  let traceArtifactUrl = null;

  const consoleLogs = [];
  const networkLogs = [];

  try {
    // Launch requested browser engine
    browser = await launcher.launch({
      headless: options.headless !== false,
      args:
        launcher === chromium
          ? [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
            ]
          : [],
    });

    const contextOptions = {
      viewport: options.viewport || { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    };

    // Prepare video recording directory if enabled
    if (enableVideo) {
      tempVideoDir = path.join(os.tmpdir(), `pramana_vid_${runId}_${Date.now()}`);
      await fs.mkdir(tempVideoDir, { recursive: true });
      contextOptions.recordVideo = {
        dir: tempVideoDir,
        size: options.viewport || { width: 1280, height: 720 },
      };
    }

    context = await browser.newContext(contextOptions);

    // Initialize Playwright tracing
    if (enableTracing) {
      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true,
      });
    }

    page = await context.newPage();

    // Browser console event listener
    page.on('console', (msg) => {
      if (consoleLogs.length < 250) {
        let loc = null;
        try {
          const l = msg.location();
          if (l && l.url) {
            loc = `${l.url}:${l.lineNumber || 0}`;
          }
        } catch {
          // ignore location parse error
        }

        consoleLogs.push({
          type: msg.type() || 'log',
          text: (msg.text() || '').slice(0, 1000),
          location: loc,
          timestamp: new Date(),
        });
      }
    });

    // Network request & response listeners (sensitive headers never recorded)
    page.on('response', (res) => {
      if (networkLogs.length < 250) {
        try {
          const req = res.request();
          networkLogs.push({
            method: req.method() || 'GET',
            url: (req.url() || '').slice(0, 500),
            status: res.status() || 0,
            resourceType: req.resourceType() || 'other',
            duration: 0,
            timestamp: new Date(),
          });
        } catch {
          // ignore response error
        }
      }
    });

    // Execute consumer test logic
    return await callback({
      browser,
      context,
      page,
      consoleLogs,
      networkLogs,
      runId,
    });
  } finally {
    // 1. Keep video reference before closing page
    let recordedVideo = null;
    if (page && enableVideo) {
      try {
        recordedVideo = page.video();
      } catch (err) {
        logger.debug('No video object available:', err.message);
      }
    }

    // 2. Stop tracing if enabled before closing context
    if (context && enableTracing && runId) {
      try {
        traceArtifactUrl = await saveTrace(context, runId);
      } catch (err) {
        logger.warn('Failed to stop and save trace:', err.message);
      }
    }

    // 3. Close page
    if (page) {
      try {
        await page.close();
      } catch (err) {
        logger.warn('Failed to close page:', err.message);
      }
    }

    // 4. Close context (flushes recorded video to disk)
    if (context) {
      try {
        await context.close();
      } catch (err) {
        logger.warn('Failed to close context:', err.message);
      }
    }

    // 5. Finalize video file
    if (recordedVideo && enableVideo && runId) {
      try {
        const videoTempPath = await recordedVideo.path();
        if (videoTempPath) {
          videoArtifactUrl = await saveVideo(videoTempPath, runId);
        }
      } catch (err) {
        logger.warn('Failed to save recorded video artifact:', err.message);
      }
    }

    // 6. Clean up temporary video staging directory if empty
    if (tempVideoDir) {
      try {
        await fs.rm(tempVideoDir, { recursive: true, force: true });
      } catch {
        // ignore temp cleanup error
      }
    }

    // 7. Close browser process
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        logger.warn('Failed to close browser:', err.message);
      }
    }
  }
}
