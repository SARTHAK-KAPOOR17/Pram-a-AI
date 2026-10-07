import { logger } from './logger.js';

/**
 * Pramāṇa AI — Failure Diagnostics & Self-Healing Preparation
 *
 * Captures structured failure context and DOM state when a test step fails.
 * Designed to provide rich telemetry for Phase 4 (AI Failure Analysis) and
 * Phase 5 (Self-Healing) while guaranteeing that:
 * 1. No credentials, tokens, or environment secrets are captured.
 * 2. Unhandled evaluation errors never crash the runtime.
 * 3. DOM strings and attribute collections are strictly bounded in size.
 *
 * @param {import('playwright').Page} page - Active Playwright page
 * @param {object} step - The failing TestCase step
 * @param {Error} error - The caught step execution error
 * @returns {Promise<object>} Structured failure diagnostics
 */
export async function captureFailureContext(page, step, error) {
  let domContext = null;

  try {
    if (page && typeof page.evaluate === 'function') {
      domContext = await page.evaluate((stepLocator) => {
        try {
          const result = {
            title: document.title || '',
            url: window.location.href || '',
            readyState: document.readyState || '',
          };

          if (!stepLocator || !stepLocator.value) {
            return result;
          }

          let el = null;
          const strategy = (stepLocator.strategy || 'css').toLowerCase();
          const val = stepLocator.value.trim();

          if (strategy === 'id') {
            const cleanId = val.startsWith('#') ? val.slice(1) : val;
            el = document.getElementById(cleanId);
          } else if (strategy === 'css') {
            try {
              el = document.querySelector(val);
            } catch {}
          } else if (strategy === 'testid') {
            try {
              el = document.querySelector(`[data-testid="${val}"], [data-test="${val}"]`);
            } catch {}
          } else if (strategy === 'text') {
            const allElements = Array.from(document.querySelectorAll('*'));
            el = allElements.find((e) => (e.innerText || e.textContent || '').trim().includes(val));
          }

          if (el) {
            result.elementFound = true;
            result.tagName = el.tagName.toLowerCase();
            result.elementText = (el.innerText || el.textContent || '').slice(0, 200).trim();
            result.elementRole = el.getAttribute('role') || el.tagName.toLowerCase();
            result.className = (el.className || '').toString().slice(0, 200);

            // Extract non-sensitive element attributes
            const attrs = {};
            const sensitiveAttrPattern = /password|token|secret|auth|credit|cvv|ssn/i;
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i];
              if (!sensitiveAttrPattern.test(attr.name)) {
                attrs[attr.name] = attr.value.slice(0, 100);
              }
            }
            result.elementAttributes = attrs;
            result.outerHTML = (el.outerHTML || '').slice(0, 500);
          } else {
            result.elementFound = false;
            // Gather safe candidate elements with matching tag names or roles
            const candidates = Array.from(
              document.querySelectorAll('button, a, input, select, textarea, [role="button"]')
            )
              .slice(0, 5)
              .map((c) => ({
                tag: c.tagName.toLowerCase(),
                text: (c.innerText || c.textContent || '').slice(0, 60).trim(),
                id: c.id || undefined,
                name: c.getAttribute('name') || undefined,
                role: c.getAttribute('role') || undefined,
              }));
            result.candidateElements = candidates;
          }

          return result;
        } catch (evalErr) {
          return { evaluationError: evalErr.message };
        }
      }, step.locator);
    }
  } catch (err) {
    logger.debug('Could not capture DOM context during step failure:', err.message);
    domContext = { evaluationError: err.message };
  }

  return {
    stepOrder: step.order,
    action: step.action,
    locatorStrategy: step.locator?.strategy || null,
    locatorValue: step.locator?.value || null,
    error: error.message,
    currentUrl: page?.url ? page.url() : '',
    domContext,
    timestamp: new Date(),
  };
}
