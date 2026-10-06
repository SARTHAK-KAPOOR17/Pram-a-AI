import api from './api.js';

export const testCaseService = {
  getTestCases: async (projectId, params = {}) => {
    const res = await api.get(`/projects/${projectId}/test-cases`, { params });
    return res.data || [];
  },

  getTestCaseById: async (testId) => {
    const res = await api.get(`/test-cases/${testId}`);
    return res.data;
  },

  createTestCase: async (projectId, testData) => {
    const res = await api.post(`/projects/${projectId}/test-cases`, testData);
    return res.data;
  },

  updateTestCase: async (testId, testData) => {
    const res = await api.patch(`/test-cases/${testId}`, testData);
    return res.data;
  },

  deleteTestCase: async (testId) => {
    const res = await api.delete(`/test-cases/${testId}`);
    return res.data;
  },
};
