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
    failureDetails: {
      type: mongoose.Schema.Types.Mixed,
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
    trace: {
      type: String,
      default: null,
    },
    video: {
      type: String,
      default: null,
    },
    networkHar: {
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
    suiteRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SuiteRun',
      default: null,
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
      enum: ['chromium', 'firefox', 'webkit'],
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
    consoleLogs: [
      {
        type: { type: String, default: 'log' },
        text: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        location: { type: String, default: null },
      },
    ],
    networkLogs: [
      {
        method: { type: String, default: 'GET' },
        url: { type: String, default: '' },
        status: { type: Number, default: 0 },
        resourceType: { type: String, default: '' },
        duration: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    failureDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Performance indexes for querying runs
testRunSchema.index({ projectId: 1, createdAt: -1 });
testRunSchema.index({ testCaseId: 1, createdAt: -1 });
testRunSchema.index({ suiteRunId: 1 });
testRunSchema.index({ environmentId: 1 });
testRunSchema.index({ status: 1 });

export const TestRun = mongoose.model('TestRun', testRunSchema);

