import api from './api.js';

export const testRunService = {
  executeTestRun: async (runData) => {
    const res = await api.post('/test-runs', runData);
    return res.data;
  },

  getTestRunById: async (runId) => {
    const res = await api.get(`/test-runs/${runId}`);
    return res.data;
  },

  getRunsByTestCase: async (testCaseId) => {
    const res = await api.get(`/test-cases/${testCaseId}/runs`);
    return res.data || [];
  },

  getRunsByProject: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/test-runs`);
    return res.data || [];
  },

  executeSuiteRun: async (suiteId, runData) => {
    const res = await api.post(`/suites/${suiteId}/runs`, runData);
    return res.data;
  },

  getSuiteRunById: async (suiteRunId) => {
    const res = await api.get(`/suite-runs/${suiteRunId}`);
    return res.data;
  },

  getSuiteRunsByProject: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/suite-runs`);
    return res.data || [];
  },

  getRunsBySuite: async (suiteId) => {
    const res = await api.get(`/suites/${suiteId}/runs`);
    return res.data || [];
  },
};
