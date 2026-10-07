import mongoose from 'mongoose';

const stepResultSchema = new mongoose.Schema(
  {
    stepId: {
      type: String,
      default: null,
    },
    order: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'PASSED', 'FAILED', 'SKIPPED'],
      default: 'PENDING',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
    screenshot: {
      type: String,
      default: null,
    },
    currentUrl: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const testRunArtifactsSchema = new mongoose.Schema(
  {
    screenshot: {
      type: String,
      default: null,
    },
    currentUrl: {
      type: String,
      default: null,
    },
    failedStepOrder: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const testRunSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'TestRun must belong to a project'],
    },
    testCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
      required: [true, 'TestRun must belong to a test case'],
    },
    environmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Environment',
      required: [true, 'TestRun must specify an environment'],
    },
    status: {
      type: String,
      enum: ['QUEUED', 'RUNNING', 'PASSED', 'FAILED', 'ERROR', 'CANCELLED'],
      default: 'QUEUED',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Triggered by user is required'],
    },
    browser: {
      type: String,
      default: 'chromium',
    },
    error: {
      message: { type: String, default: null },
      stack: { type: String, default: null },
    },
    artifacts: {
      type: testRunArtifactsSchema,
      default: () => ({}),
    },
    stepResults: [stepResultSchema],
  },
  {
    timestamps: true,
  }
);

// Performance indexes for querying runs
testRunSchema.index({ projectId: 1, createdAt: -1 });
testRunSchema.index({ testCaseId: 1, createdAt: -1 });
testRunSchema.index({ environmentId: 1 });
testRunSchema.index({ status: 1 });

export const TestRun = mongoose.model('TestRun', testRunSchema);
