import { Project } from '../models/project.model.js';
import { Environment } from '../models/environment.model.js';
import { TestSuite } from '../models/suite.model.js';
import { TestCase } from '../models/test-case.model.js';
import { AppError } from '../utils/api-error.js';

/**
 * Asserts user access to a project (owner or member).
 */
export const assertProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const isOwner = project.owner.toString() === userId.toString();
  const isMember = project.members.some(
    (m) => m.user && m.user.toString() === userId.toString()
  );

  if (!isOwner && !isMember) {
    throw AppError.forbidden('You do not have permission to access this project');
  }

  return project;
};

export const createProject = async (userId, data) => {
  const project = await Project.create({
    ...data,
    owner: userId,
    members: [{ user: userId, role: 'owner' }],
  });

  // Automatically create a default 'Production' or 'Staging' environment
  await Environment.create({
    projectId: project._id,
    name: 'Production',
    baseUrl: project.baseUrl,
    isDefault: true,
  });

  return project;
};

export const getProjects = async (userId) => {
  const projects = await Project.find({
    $or: [{ owner: userId }, { 'members.user': userId }],
    status: { $ne: 'archived' },
  }).sort({ updatedAt: -1 });

  // Enrich with test count and suite count
  const enriched = await Promise.all(
    projects.map(async (p) => {
      const [testCount, suiteCount] = await Promise.all([
        TestCase.countDocuments({ projectId: p._id }),
        TestSuite.countDocuments({ projectId: p._id }),
      ]);
      return {
        ...p.toObject(),
        testCount,
        suiteCount,
      };
    })
  );

  return enriched;
};

export const getProjectById = async (projectId, userId) => {
  const project = await assertProjectAccess(projectId, userId);
  const [testCount, suiteCount, environmentCount] = await Promise.all([
    TestCase.countDocuments({ projectId: project._id }),
    TestSuite.countDocuments({ projectId: project._id }),
    Environment.countDocuments({ projectId: project._id }),
  ]);

  return {
    ...project.toObject(),
    testCount,
    suiteCount,
    environmentCount,
  };
};

export const updateProject = async (projectId, userId, updateData) => {
  await assertProjectAccess(projectId, userId);

  const updated = await Project.findByIdAndUpdate(
    projectId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  return updated;
};

export const deleteProject = async (projectId, userId) => {
  const project = await assertProjectAccess(projectId, userId);
  
  // Only owner can delete project
  if (project.owner.toString() !== userId.toString()) {
    throw AppError.forbidden('Only the project owner can delete this project');
  }

  // Soft delete (archive) or hard delete
  await Project.findByIdAndUpdate(projectId, { status: 'archived' });
  return { message: 'Project archived successfully' };
};
