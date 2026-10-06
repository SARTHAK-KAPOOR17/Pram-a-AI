import api from './api.js';

export const environmentService = {
  getEnvironments: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/environments`);
    return res.data || [];
  },

  getEnvironmentById: async (envId) => {
    const res = await api.get(`/environments/${envId}`);
    return res.data;
  },

  createEnvironment: async (projectId, envData) => {
    const res = await api.post(`/projects/${projectId}/environments`, envData);
    return res.data;
  },

  updateEnvironment: async (envId, envData) => {
    const res = await api.patch(`/environments/${envId}`, envData);
    return res.data;
  },

  deleteEnvironment: async (envId) => {
    const res = await api.delete(`/environments/${envId}`);
    return res.data;
  },
};
