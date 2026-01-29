import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in seconds
      default: null,
    },
    width: Number,
    height: Number,
    fileExtension: String,
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    sensitivityStatus: {
      type: String,
      enum: ['pending', 'safe', 'flagged'],
      default: 'pending',
    },
    sensitivityDetails: {
      score: Number, // 0-100
      reason: String,
      flags: [String], // Keywords or patterns that triggered flagging
    },
    processingProgress: {
      type: Number,
      default: 0, // 0-100
    },
    processingError: String,
    filePath: String,
    streamingUrl: String,
    isPublic: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [String],
    description: String,
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
videoSchema.index({ tenantId: 1, ownerId: 1 });
videoSchema.index({ tenantId: 1, processingStatus: 1 });
videoSchema.index({ tenantId: 1, sensitivityStatus: 1 });

const Video = mongoose.model('Video', videoSchema);

export default Video;
