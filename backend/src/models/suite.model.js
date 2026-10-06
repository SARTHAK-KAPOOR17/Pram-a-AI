import mongoose from 'mongoose';

const testSuiteSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Test suite must belong to a project'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Suite name is required'],
      trim: true,
      minlength: [2, 'Suite name must be at least 2 characters'],
      maxlength: [100, 'Suite name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
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

// Compound index on projectId + name
testSuiteSchema.index({ projectId: 1, name: 1 });

export const TestSuite = mongoose.model('TestSuite', testSuiteSchema);
