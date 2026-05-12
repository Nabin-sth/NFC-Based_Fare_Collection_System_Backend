import mongoose from "mongoose";

const nfcCardSchema = new mongoose.Schema({
  cardUid: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  balance: {
    type: Number,
    default: 0,
    min: 0,
  },

  cardType: {
    type: String,
    enum: ["personal", "student", "senior", "temporary"],
    default: "personal",
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  status: {
    type: String,
    enum: ["active", "block_requested", "blocked"],
    default: "active",
    index: true,
  },

  verifiedAt: Date,

  lastUsedAt: Date,

  blockRequestedAt: Date,

  blockRequestReason: {
    type: String,
    trim: true,
    maxlength: 240,
  },

  blockedAt: Date,

  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  blockRejectedAt: Date,

  blockRejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  unblockedAt: Date,

  unblockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

nfcCardSchema.index({ user: 1 });
nfcCardSchema.index({ user: 1, status: 1 });
nfcCardSchema.index({ status: 1, blockRequestedAt: -1 });

export const NfcCard = mongoose.model("NfcCard", nfcCardSchema);
