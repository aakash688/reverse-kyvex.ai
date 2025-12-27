import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    default: null,
  },
  name: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rateLimit: {
    type: Number,
    default: null,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  lastUsedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('ApiKey', apiKeySchema);

