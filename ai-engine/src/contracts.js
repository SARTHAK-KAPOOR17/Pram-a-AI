/**
 * Pramāṇa AI — AI Engine Contracts (JavaScript)
 *
 * Defines the request/response payloads, taxonomies, and data contracts
 * for future AI services (Failure Analysis, RCA, Healing, and Generation).
 */

/**
 * Taxonomies for classified test failures
 */
export const FailureCategory = Object.freeze({
  SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND',
  ASSERTION_FAILED: 'ASSERTION_FAILED',
  TIMEOUT: 'TIMEOUT',
  NETWORK_FAILURE: 'NETWORK_FAILURE',
  ENVIRONMENT_DOWN: 'ENVIRONMENT_DOWN',
  FLAKY_RACE_CONDITION: 'FLAKY_RACE_CONDITION',
  UNKNOWN: 'UNKNOWN',
});

/**
 * Taxonomies for Root Cause classification
 */
export const RootCauseType = Object.freeze({
  APPLICATION_BUG: 'APPLICATION_BUG',
  TEST_SCRIPT_DEFECT: 'TEST_SCRIPT_DEFECT',
  SELECTOR_OBSOLESCENCE: 'SELECTOR_OBSOLESCENCE',
  ENVIRONMENTAL_INFRA: 'ENVIRONMENTAL_INFRA',
  THIRD_PARTY_SERVICE: 'THIRD_PARTY_SERVICE',
});

/**
 * Example Payload Contracts for Future Service Implementations
 */
export const AIContracts = {
  /**
   * Request structure for failure analysis
   * @typedef {Object} FailureAnalysisRequest
   * @property {string} testRunId
   * @property {string} testCaseId
   * @property {string} errorMessage
   * @property {string} stackTrace
   * @property {string} [domSnapshot]
   * @property {string} [screenshotBase64]
   * @property {Array<Object>} [consoleLogs]
   * @property {Array<Object>} [networkLogs]
   */

  /**
   * Response structure from selector healing
   * @typedef {Object} SelectorHealingProposal
   * @property {string} originalSelector
   * @property {string} proposedSelector
   * @property {'css'|'xpath'|'text'|'role'} selectorType
   * @property {number} confidenceScore - Value between 0.0 and 1.0
   * @property {string} rationale
   * @property {boolean} shouldAutoApply - True if confidence exceeds threshold (e.g. >= 0.85)
   */

  /**
   * Helper validator to ensure contracts conform to specifications
   */
  validateFailureRequest: (payload) => {
    return Boolean(
      payload &&
      typeof payload.testRunId === 'string' &&
      typeof payload.errorMessage === 'string'
    );
  },
};
