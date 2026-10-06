import mongoose from 'mongoose';

const variableSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      default: '',
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const environmentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Environment must belong to a project'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Environment name is required'],
      trim: true,
      maxlength: [50, 'Environment name cannot exceed 50 characters'],
    },
    baseUrl: {
      type: String,
      required: [true, 'Environment Base URL is required'],
      trim: true,
    },
    variables: [variableSchema],
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index on projectId + name
environmentSchema.index({ projectId: 1, name: 1 }, { unique: true });

export const Environment = mongoose.model('Environment', environmentSchema);
