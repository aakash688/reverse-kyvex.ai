import mongoose from 'mongoose';

const apiUsageLogSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: true,
    index: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  model: {
    type: String,
    default: null,
  },
  method: {
    type: String,
    required: true,
  },
  statusCode: {
    type: Number,
    required: true,
  },
  responseTime: {
    type: Number,
    required: true, // milliseconds
  },
  requestSize: {
    type: Number,
    default: null, // bytes
  },
  responseSize: {
    type: Number,
    default: null, // bytes
  },
  error: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// TTL index to auto-delete logs after 90 days
apiUsageLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Compound indexes for analytics queries
apiUsageLogSchema.index({ apiKey: 1, timestamp: -1 });
apiUsageLogSchema.index({ endpoint: 1, timestamp: -1 });
apiUsageLogSchema.index({ model: 1, timestamp: -1 });
apiUsageLogSchema.index({ statusCode: 1, timestamp: -1 });

export default mongoose.model('ApiUsageLog', apiUsageLogSchema);

