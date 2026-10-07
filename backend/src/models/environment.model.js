import mongoose from 'mongoose';

const encryptedDataSchema = new mongoose.Schema(
  {
    encrypted: {
      type: Boolean,
      default: false,
    },
    iv: {
      type: String,
      default: null,
    },
    authTag: {
      type: String,
      default: null,
    },
    ciphertext: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

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
    encryptedData: {
      type: encryptedDataSchema,
      default: null,
    },
  },
  {
    _id: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.encryptedData;
        if (ret.isSecret) {
          ret.value = '••••••••';
        }
        return ret;
      },
    },
  }
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
