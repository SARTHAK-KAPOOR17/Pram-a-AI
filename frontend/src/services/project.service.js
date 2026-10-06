import api from './api.js';

export const projectService = {
  getProjects: async () => {
    const res = await api.get('/projects');
    return res.data || [];
  },

  getProjectById: async (projectId) => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data;
  },

  createProject: async (projectData) => {
    const res = await api.post('/projects', projectData);
    return res.data;
  },

  updateProject: async (projectId, projectData) => {
    const res = await api.patch(`/projects/${projectId}`, projectData);
    return res.data;
  },

  deleteProject: async (projectId) => {
    const res = await api.delete(`/projects/${projectId}`);
    return res.data;
  },
};
