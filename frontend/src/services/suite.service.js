import api from './api.js';

export const suiteService = {
  getSuites: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/suites`);
    return res.data || [];
  },

  getSuiteById: async (suiteId) => {
    const res = await api.get(`/suites/${suiteId}`);
    return res.data;
  },

  createSuite: async (projectId, suiteData) => {
    const res = await api.post(`/projects/${projectId}/suites`, suiteData);
    return res.data;
  },

  updateSuite: async (suiteId, suiteData) => {
    const res = await api.patch(`/suites/${suiteId}`, suiteData);
    return res.data;
  },

  deleteSuite: async (suiteId) => {
    const res = await api.delete(`/suites/${suiteId}`);
    return res.data;
  },
};
