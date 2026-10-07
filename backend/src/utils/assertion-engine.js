import { resolveLocator } from './locator-resolver.js';

/**
 * Pramāṇa AI — Assertion Engine
 *
 * Executes structured Playwright assertions matching Phase 2 specifications:
 * - visible: Element is visible on page
 * - hidden: Element is hidden / not visible
 * - text_contains: Element contains substring
 * - text_equals: Element text exactly matches expected string
 * - url_contains: Browser URL contains substring
 * - url_equals: Browser URL exactly matches expected string
 * - enabled: Element is interactable / enabled
 * - disabled: Element is disabled
 *
 * Assertion failures produce clear, structured error messages without crashing the runtime.
 *
 * @param {import('playwright').Page} page - Active Playwright page
 * @param {object} assertion - Assertion definition from test step
 * @param {object} [options] - Optional execution configuration
 * @param {number} [options.timeout=5000] - Assertion timeout in milliseconds
 * @returns {Promise<{ success: boolean, actual?: string, expected?: string }>}
 */
export async function executeAssertion(page, assertion, options = {}) {
  if (!assertion || !assertion.type) {
    throw new Error('Assertion object must specify an assertion type');
  }

  const timeout = options.timeout || 5000;
  const { type, locator: locDef, expectedValue } = assertion;

  // Assertions that operate on a target DOM locator
  const requiresLocator = [
    'visible',
    'hidden',
    'text_contains',
    'text_equals',
    'enabled',
    'disabled',
  ].includes(type);

  let locator = null;
  if (requiresLocator) {
    if (!locDef || !locDef.value) {
      throw new Error(`Assertion "${type}" requires a target locator with a valid value`);
    }
    locator = resolveLocator(page, locDef.strategy || 'css', locDef.value);
  }

  switch (type) {
    case 'visible': {
      try {
        await locator.waitFor({ state: 'visible', timeout });
        return { success: true, actual: 'visible', expected: 'visible' };
      } catch (err) {
        throw new Error(
          `Assertion failed: Element [${locDef.strategy}: "${locDef.value}"] was not visible within ${timeout}ms`
        );
      }
    }

    case 'hidden': {
      try {
        await locator.waitFor({ state: 'hidden', timeout });
        return { success: true, actual: 'hidden', expected: 'hidden' };
      } catch (err) {
        throw new Error(
          `Assertion failed: Element [${locDef.strategy}: "${locDef.value}"] was not hidden within ${timeout}ms`
        );
      }
    }

    case 'text_contains': {
      await locator.waitFor({ state: 'visible', timeout });
      const actualText = await locator.innerText();
      const expected = String(expectedValue || '');
      if (!actualText.includes(expected)) {
        throw new Error(
          `Assertion failed: Element [${locDef.strategy}: "${locDef.value}"] innerText "${actualText}" does not contain expected substring "${expected}"`
        );
      }
      return { success: true, actual: actualText, expected };
    }

    case 'text_equals': {
      await locator.waitFor({ state: 'visible', timeout });
      const actualText = (await locator.innerText()).trim();
      const expected = String(expectedValue || '').trim();
      if (actualText !== expected) {
        throw new Error(
          `Assertion failed: Element [${locDef.strategy}: "${locDef.value}"] text "${actualText}" does not equal expected "${expected}"`
        );
      }
      return { success: true, actual: actualText, expected };
    }

    case 'url_contains': {
      const currentUrl = page.url();
      const expected = String(expectedValue || '');
      if (!currentUrl.includes(expected)) {
        throw new Error(
          `Assertion failed: Current page URL "${currentUrl}" does not contain expected substring "${expected}"`
        );
      }
      return { success: true, actual: currentUrl, expected };
    }

    case 'url_equals': {
      const currentUrl = page.url();
      const expected = String(expectedValue || '');
      if (currentUrl !== expected) {
        throw new Error(
          `Assertion failed: Current page URL "${currentUrl}" does not equal expected "${expected}"`
        );
      }
      return { success: true, actual: currentUrl, expected };
    }

    case 'enabled': {
      await locator.waitFor({ state: 'attached', timeout });
      const isEnabled = await locator.isEnabled();
      if (!isEnabled) {
        throw new Error(
          `Assertion failed: Element [${locDef.strategy}: "${locDef.value}"] is disabled, expected enabled`
        );
      }
      return { success: true, actual: 'enabled', expected: 'enabled' };
    }

    case 'disabled': {
      await locator.waitFor({ state: 'attached', timeout });
      const isDisabled = await locator.isDisabled();
      if (!isDisabled) {
        throw new Error(
          `Assertion failed: Element [${locDef.strategy}: "${locDef.value}"] is enabled, expected disabled`
        );
      }
      return { success: true, actual: 'disabled', expected: 'disabled' };
    }

    default:
      throw new Error(`Unsupported assertion type: "${type}"`);
  }
}
