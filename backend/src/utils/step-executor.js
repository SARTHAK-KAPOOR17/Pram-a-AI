import { resolveLocator } from './locator-resolver.js';
import { executeAssertion } from './assertion-engine.js';

/**
 * Interpolates {{VARIABLE_NAME}} tokens in strings using decrypted environment variables.
 *
 * @param {string} text - Input text containing potential {{VAR}} placeholders
 * @param {Record<string, string>} [variables={}] - Key-value environment variables
 * @returns {string} Interpolated text
 */
export function interpolateVariables(text, variables = {}) {
  if (typeof text !== 'string') return text;
  return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

/**
 * Pramāṇa AI — Step Executor
 *
 * Executes a single sequential test step on the provided Playwright page
 * according to the exact Phase 2 TestCase step schema.
 *
 * Supported Actions:
 * - navigate: Navigates to target URL or path resolved with base URL
 * - click: Clicks on target locator
 * - fill: Fills form input with resolved value
 * - select: Selects option from dropdown
 * - check: Checks checkbox or radio button
 * - uncheck: Unchecks checkbox
 * - hover: Hovers cursor over target element
 * - press: Presses keyboard key on targeted element
 * - wait: Explicitly waits for specified ms or target selector
 * - assert: Runs assertion verification
 *
 * @param {import('playwright').Page} page - Active Playwright page
 * @param {object} step - TestCase step object
 * @param {object} [context={}] - Execution context
 * @param {string} [context.baseUrl] - Environment base URL
 * @param {Record<string, string>} [context.variables={}] - Decrypted environment variables
 * @param {number} [context.timeout=5000] - Step timeout in milliseconds
 * @returns {Promise<{ action: string, currentUrl: string }>}
 */
export async function executeStep(page, step, context = {}) {
  if (!page) {
    throw new Error('Playwright page is required for step execution');
  }
  if (!step || !step.action) {
    throw new Error('Invalid test step: action is required');
  }

  const { baseUrl = '', variables = {}, timeout = 5000 } = context;
  const rawValue = step.value;
  const resolvedValue = interpolateVariables(rawValue, variables);

  switch (step.action) {
    case 'navigate': {
      let targetUrl = resolvedValue || '/';
      if (baseUrl && !/^https?:\/\//i.test(targetUrl)) {
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const cleanPath = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
        targetUrl = `${cleanBase}${cleanPath}`;
      }

      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: Math.max(timeout, 15000),
      });
      break;
    }

    case 'click': {
      if (!step.locator || !step.locator.value) {
        throw new Error('Click action requires a target locator');
      }
      const locator = resolveLocator(
        page,
        step.locator.strategy,
        step.locator.value,
        step.locator
      );
      await locator.click({ timeout });
      break;
    }

    case 'fill': {
      if (!step.locator || !step.locator.value) {
        throw new Error('Fill action requires a target locator');
      }
      const locator = resolveLocator(
        page,
        step.locator.strategy,
        step.locator.value,
        step.locator
      );
      await locator.fill(resolvedValue || '', { timeout });
      break;
    }

    case 'select': {
      if (!step.locator || !step.locator.value) {
        throw new Error('Select action requires a target locator');
      }
      const locator = resolveLocator(
        page,
        step.locator.strategy,
        step.locator.value,
        step.locator
      );
      await locator.selectOption(resolvedValue || '', { timeout });
      break;
    }

    case 'check': {
      if (!step.locator || !step.locator.value) {
        throw new Error('Check action requires a target locator');
      }
      const locator = resolveLocator(
        page,
        step.locator.strategy,
        step.locator.value,
        step.locator
      );
      await locator.check({ timeout });
      break;
    }

    case 'uncheck': {
      if (!step.locator || !step.locator.value) {
        throw new Error('Uncheck action requires a target locator');
      }
      const locator = resolveLocator(
        page,
        step.locator.strategy,
        step.locator.value,
        step.locator
      );
      await locator.uncheck({ timeout });
      break;
    }

    case 'hover': {
      if (!step.locator || !step.locator.value) {
        throw new Error('Hover action requires a target locator');
      }
      const locator = resolveLocator(
        page,
        step.locator.strategy,
        step.locator.value,
        step.locator
      );
      await locator.hover({ timeout });
      break;
    }

    case 'press': {
      if (!step.locator || !step.locator.value) {
        throw new Error('Press action requires a target locator');
      }
      const locator = resolveLocator(
        page,
        step.locator.strategy,
        step.locator.value,
        step.locator
      );
      await locator.press(resolvedValue || 'Enter', { timeout });
      break;
    }

    case 'wait': {
      // Explicit wait: only explicit wait steps may intentionally delay
      if (resolvedValue && /^\d+$/.test(resolvedValue.trim())) {
        const waitMs = parseInt(resolvedValue.trim(), 10);
        await page.waitForTimeout(waitMs);
      } else if (resolvedValue) {
        await page.waitForSelector(resolvedValue.trim(), { timeout: Math.max(timeout, 10000) });
      } else {
        await page.waitForTimeout(1000);
      }
      break;
    }

    case 'assert': {
      await executeAssertion(page, step.assertion, { timeout });
      break;
    }

    default:
      throw new Error(`Unsupported test action: "${step.action}"`);
  }

  return {
    action: step.action,
    currentUrl: page.url ? page.url() : '',
  };
}
