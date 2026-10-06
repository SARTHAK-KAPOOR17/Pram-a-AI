import * as projectService from '../services/project.service.js';
import { ApiResponse } from '../utils/api-response.js';

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.user._id, req.body);
    return ApiResponse.created(res, project, 'Project created successfully');
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await projectService.getProjects(req.user._id);
    return ApiResponse.success(res, projects, 'Projects retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user._id);
    return ApiResponse.success(res, project, 'Project retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const updated = await projectService.updateProject(
      req.params.id,
      req.user._id,
      req.body
    );
    return ApiResponse.success(res, updated, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user._id);
    return ApiResponse.success(res, result, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};
