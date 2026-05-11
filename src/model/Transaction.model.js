import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema(
  {
    txnId: {
      type: String,
      required: true,
      unique: true,
    },

    nfcCard: {
      type: Schema.Types.ObjectId,
      ref: "NfcCard",
      required: true,
    },

    passenger: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
    },

    busId: {
      type: Schema.Types.ObjectId,
      ref: "Bus",
    },

    khalti: {
      pidx: String,
      transactionId: String,

      // IMPORTANT:
      // Store this in NPR in your database.
      // Khalti API payload/lookup uses paisa, but DB should store NPR.
      amount: {
        type: Number,
        default: 0,
      },

      payment_url: String,

      status: {
        type: String,
        enum: ["initiated", "completed", "failed", "refunded", "cancelled"],
      },
    },

    isAutoTopup: {
      type: Boolean,
      default: false,
    },

    requiredTopup: {
      type: Number,
      default: 0,
    },

    // Keep this if older code already uses it.
    operatorId: {
      type: Schema.Types.ObjectId,
      ref: "Operator",
    },

    // Add these because tap.service.js creates operator and driver.
    operator: {
      type: Schema.Types.ObjectId,
      ref: "Operator",
    },

    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
    },

    paymentMethod: {
      type: String,
      enum: ["nfc_card", "khalti", "khalti_auto"],
    },

    description: {
      type: String,
      trim: true,
    },

    tapIn: {
      time: {
        type: Date,
        default: Date.now,
      },
      stop: {
        type: Schema.Types.ObjectId,
        ref: "Stop",
      },
      location: {
        type: [Number],
        index: "2dsphere",
      },
    },

    tapOut: {
      time: Date,
      stop: {
        type: Schema.Types.ObjectId,
        ref: "Stop",
      },
      location: {
        type: [Number],
        index: "2dsphere",
      },
    },

    // Fare debited from NFC card.
    fare: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "pending_exit",
        "payment_initiated",
        "completed",
        "no_tap_out",
        "failed",
        "refunded",
        "payment_required",
      ],
      default: "pending_exit",
    },

    offline: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

transactionSchema.index({ txnId: 1 }, { unique: true });
transactionSchema.index({ passenger: 1, createdAt: -1 });
transactionSchema.index({ nfcCard: 1, createdAt: -1 });
transactionSchema.index({ nfcCard: 1, status: 1 });
transactionSchema.index({ trip: 1 });
transactionSchema.index({ "khalti.pidx": 1 });
transactionSchema.index({ "khalti.status": 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
// import mongoose, { Schema } from "mongoose";

// const transactionSchema = new Schema(
//   {
//     txnId: { type: String, required: true, unique: true }, // e.g. TXN-20251229-001A
//     nfcCard: { type: Schema.Types.ObjectId, ref: "NfcCard", required: true },
//     passenger: { type: Schema.Types.ObjectId, ref: "User" },
//     trip: { type: Schema.Types.ObjectId, ref: "Trip" },
//     busId: {
//       type: Schema.Types.ObjectId,
//       ref: "Bus",
//     },
//     khalti: {
//       pidx: String,
//       transactionId: String,
//       amount: Number,
//       status: {
//         type: String,
//         enum: ["initiated", "completed", "failed", "refunded", "cancelled"],
//       },
//     },

//     isAutoTopup: {
//       type: Boolean,
//       default: false,
//     },
//     requiredTopup: {
//       type: Number,
//       default: 0,
//     },

//     operatorId: {
//       type: Schema.Types.ObjectId,
//       ref: "Operator",
//     },

//     tapIn: {
//       // FIX: was Date.now() — evaluated once at module load, all docs shared same timestamp.
//       // Date.now (no parens) is called per-document at creation time.
//       time: { type: Date, default: Date.now },
//       stop: { type: Schema.Types.ObjectId, ref: "Stop" },
//       location: { type: [Number], index: "2dsphere" }, // [lng, lat]
//     },
//     tapOut: {
//       time: Date,
//       stop: { type: Schema.Types.ObjectId, ref: "Stop" },
//       location: { type: [Number], index: "2dsphere" },
//     },

//     fare: { type: Number }, // calculated on tap-out

//     status: {
//       type: String,
//       enum: [
//         "pending_exit",
//         "payment_initiated",
//         "completed",
//         "no_tap_out",
//         "failed",
//         "refunded",
//         "payment_required",
//       ],
//       default: "pending_exit",
//     },

//     offline: { type: Boolean, default: false }, // generated on driver tablet
//   },
//   { timestamps: true },
// );

// transactionSchema.index({ nfcCard: 1, status: 1 });
// transactionSchema.index({ trip: 1 });

// // FIX: was `new mongoose.model(...)` — mongoose.model() is a factory, not a constructor.
// export const Transaction = mongoose.model("Transaction", transactionSchema);
