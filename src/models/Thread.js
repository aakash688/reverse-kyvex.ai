import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
  threadId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  apiKey: {
    type: String,
    required: true,
    index: true,
  },
  kyvexThreadId: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastUsedAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Index for faster lookups
threadSchema.index({ apiKey: 1, threadId: 1 });

export default mongoose.model('Thread', threadSchema);

