import mongoose from 'mongoose';

// Locator schema storing baseline information for self-healing
const locatorSchema = new mongoose.Schema(
  {
    strategy: {
      type: String,
      enum: ['css', 'xpath', 'id', 'text', 'role', 'testid'],
      required: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    // Self-healing preparation fields
    domFingerprint: {
      type: String,
      default: null,
    },
    elementText: {
      type: String,
      default: null,
    },
    elementRole: {
      type: String,
      default: null,
    },
    elementAttributes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { _id: false }
);

// Assertion subdocument schema
const assertionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'visible',
        'hidden',
        'text_contains',
        'text_equals',
        'url_contains',
        'url_equals',
        'enabled',
        'disabled',
      ],
      required: true,
    },
    locator: {
      type: locatorSchema,
      default: null,
    },
    expectedValue: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

// Test step schema
const testStepSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    action: {
      type: String,
      enum: [
        'navigate',
        'click',
        'fill',
        'select',
        'check',
        'uncheck',
        'hover',
        'press',
        'wait',
        'assert',
      ],
      required: true,
    },
    locator: {
      type: locatorSchema,
      default: null,
    },
    value: {
      type: String,
      default: null,
    },
    assertion: {
      type: assertionSchema,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const testCaseSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Test case must belong to a project'],
      index: true,
    },
    suiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSuite',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Test case name is required'],
      trim: true,
      minlength: [2, 'Test case name must be at least 2 characters'],
      maxlength: [150, 'Test case name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'deprecated', 'flaky'],
      default: 'draft',
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    steps: [testStepSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying project tests by suite or status
testCaseSchema.index({ projectId: 1, suiteId: 1 });
testCaseSchema.index({ projectId: 1, status: 1 });

export const TestCase = mongoose.model('TestCase', testCaseSchema);
