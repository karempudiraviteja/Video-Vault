import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxStorageGB: {
      type: Number,
      default: 100, // 100GB default
    },
    usedStorageGB: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;
