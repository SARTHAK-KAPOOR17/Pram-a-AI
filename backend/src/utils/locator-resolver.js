/**
 * Pramāṇa AI — Locator Resolver
 *
 * Centralized, deterministic locator resolution supporting all Phase 2 strategies:
 * - css: Standard CSS selector
 * - xpath: XPath expression
 * - id: DOM element ID
 * - testid: Data-test / data-testid attributes
 * - text: Visible text match
 * - role: ARIA role match
 *
 * Architectural Note: This function is the designated future integration hook
 * for Phase 5 AI selector self-healing. In Phase 3A, it operates purely deterministically.
 *
 * @param {import('playwright').Page} page - Active Playwright page
 * @param {string} strategy - Locator strategy
 * @param {string} value - Selector or query string
 * @param {object} [metadata] - Optional self-healing metadata (elementText, elementRole)
 * @returns {import('playwright').Locator} Playwright locator
 */
export function resolveLocator(page, strategy, value, metadata = {}) {
  if (!page) {
    throw new Error('Playwright page instance is required to resolve locator');
  }

  if (!value || typeof value !== 'string') {
    throw new Error(`Locator value must be a non-empty string, received: ${value}`);
  }

  const trimmedValue = value.trim();
  const normalizedStrategy = (strategy || 'css').toLowerCase();

  switch (normalizedStrategy) {
    case 'css':
      return page.locator(trimmedValue);

    case 'xpath':
      return page.locator(
        trimmedValue.startsWith('xpath=') ? trimmedValue : `xpath=${trimmedValue}`
      );

    case 'id': {
      const idVal = trimmedValue.startsWith('#') ? trimmedValue.slice(1) : trimmedValue;
      return page.locator(`#${idVal}`);
    }

    case 'testid':
      return page.getByTestId(trimmedValue);

    case 'text':
      return page.getByText(trimmedValue);

    case 'role': {
      if (metadata && metadata.elementText) {
        return page.getByRole(trimmedValue, { name: metadata.elementText });
      }
      return page.getByRole(trimmedValue);
    }

    default:
      throw new Error(
        `Unsupported locator strategy: "${strategy}". Supported strategies are: css, xpath, id, testid, text, role`
      );
  }
}
