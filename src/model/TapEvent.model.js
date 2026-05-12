import mongoose, { Schema } from "mongoose";

const tapEventSchema = new Schema(
  {
    bus: {
      type: Schema.Types.ObjectId,
      ref: "Bus",
      index: true,
    },

    busPlate: {
      type: String,
      trim: true,
    },

    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      index: true,
    },

    operator: {
      type: Schema.Types.ObjectId,
      ref: "Operator",
      index: true,
    },

    passenger: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    nfcCard: {
      type: Schema.Types.ObjectId,
      ref: "NfcCard",
      index: true,
    },

    maskedCardUid: {
      type: String,
      trim: true,
    },

    eventType: {
      type: String,
      enum: ["tap_in", "tap_out", "payment_required", "failure", "unknown"],
      default: "unknown",
    },

    status: {
      type: String,
      trim: true,
      default: "unknown",
    },

    success: {
      type: Boolean,
      default: false,
      index: true,
    },

    message: {
      type: String,
      trim: true,
    },

    failureReason: {
      type: String,
      trim: true,
    },

    fare: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

tapEventSchema.index({ driver: 1, createdAt: -1 });
tapEventSchema.index({ bus: 1, createdAt: -1 });
tapEventSchema.index({ nfcCard: 1, createdAt: -1 });
tapEventSchema.index({ status: 1, createdAt: -1 });

export const TapEvent = mongoose.model("TapEvent", tapEventSchema);
