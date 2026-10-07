import api from './api.js';

export const testRunService = {
  executeTestRun: async (runData) => {
    // Generous timeout for browser execution
    const res = await api.post('/test-runs', runData, { timeout: 90000 });
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
};
