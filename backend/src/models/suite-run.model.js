import mongoose from 'mongoose';

const suiteRunSummarySchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    error: {
      type: Number,
      default: 0,
    },
    skipped: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const suiteRunSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'SuiteRun must belong to a project'],
    },
    suiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSuite',
      required: [true, 'SuiteRun must belong to a test suite'],
    },
    environmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Environment',
      required: [true, 'SuiteRun must specify an environment'],
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
    testRuns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestRun',
      },
    ],
    summary: {
      type: suiteRunSummarySchema,
      default: () => ({ total: 0, passed: 0, failed: 0, error: 0, skipped: 0 }),
    },
    error: {
      message: { type: String, default: null },
      stack: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Performance indexes for suite runs querying
suiteRunSchema.index({ projectId: 1, createdAt: -1 });
suiteRunSchema.index({ suiteId: 1, createdAt: -1 });
suiteRunSchema.index({ environmentId: 1 });
suiteRunSchema.index({ status: 1 });

export const SuiteRun = mongoose.model('SuiteRun', suiteRunSchema);
