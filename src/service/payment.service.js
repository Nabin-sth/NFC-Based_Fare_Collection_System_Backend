// import { asyncHandler } from "../utils/asyncHandler.js";
// import { verifyKhalti } from "./khalti.service.js";
// import { NfcCard } from "../model/Nfc.model.js";
// import { Trip } from "../model/Trip.model.js";
// import { User } from "../model/user.model.js";
// import ApiError from "../utils/ApiError.js";
// import { Transaction } from "../model/Transaction.model.js";
// // Generate a unique transaction ID
// export const generateTransactionId = () => {
//   const timestamp = Date.now();
//   const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
//   return `TXN-${timestamp}-${randomStr}`;
// };

// // Verify Khalti Payment
// export const verifyPayment = async (pidx) => {
//   if (!pidx) throw new ApiError(400, "pidx is required for verification");

//   // 1. Verify with Khalti API
//   const khaltiRes = await verifyKhalti(pidx);
//   if (khaltiRes.status !== "Completed") {
//     throw new ApiError(400, "Payment not completed");
//   }

//   // 2. Find the transaction
// let txn = await Transaction.findOne({ "khalti.pidx": pidx });
// if (!txn) {
//   txn = await Transaction.findOne({ pidx }); }

//   // Avoid double processing
//   if (txn.status === "completed") {
//     return txn;
//   }

//   // 3. Get the associated NFC card
//   const nfcCard = await NfcCard.findById(txn.nfcCard);
//   if (!nfcCard) throw new ApiError(404, "NFC card not found");

//   // 4. Convert paid amount from paisa to NPR
//   const paidAmount = (khaltiRes.total_amount || 0) / 100;

//   // AUTO-TOPUP LOGIC (when Khalti was used to cover shortfall)
//   if (txn.isAutoTopup) {
//     nfcCard.balance = (nfcCard.balance || 0) + paidAmount;

//     // Then deduct the full fare from NFC card
//     const fareToDeduct = txn.fareAmount || txn.fare || 0;
//     if (fareToDeduct > 0) {
//       nfcCard.balance -= fareToDeduct;

//       // Prevent negative balance (safety)
//       if (nfcCard.balance < 0) {
//         nfcCard.balance = 0;
//       }

//       // Update trip if linked
//       if (txn.trip) {
//         const trip = await Trip.findById(txn.trip);
//         if (trip && !trip.completed) {
//           trip.completed = true;
//           trip.exitTime = new Date();
//           await trip.save();
//         }
//       }

//       // Update passenger status if needed
//       if (txn.passenger) {
//         await User.findByIdAndUpdate(txn.passenger, { onBoard: false });
//       }
//     }
//   } else {
//     nfcCard.balance = (nfcCard.balance || 0) + paidAmount;
//   }

//   await nfcCard.save();

//   txn.status = "completed";
//   txn.khalti = txn.khalti || {};
//   txn.khalti.status = "completed";
//   txn.khalti.transactionId = khaltiRes.transaction_id || txn.khalti.transactionId;
//   txn.khalti.amount = paidAmount;

//   txn.finalNfcBalance = nfcCard.balance;

//   await txn.save();

//   return txn;
// };
import mongoose from "mongoose";

import { verifyKhalti } from "./khalti.service.js";
import { NfcCard } from "../model/Nfc.model.js";
import { Trip } from "../model/Trip.model.js";
import { User } from "../model/user.model.js";
import { Bus } from "../model/vechile.model.js";
import { Driver } from "../model/driver.model.js";
import { Operator } from "../model/operator.model.js";
import { Transaction } from "../model/Transaction.model.js";
import ApiError from "../utils/ApiError.js";

export const generateTransactionId = () => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${timestamp}-${randomStr}`;
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const roundMoney = (value) => Number(toNumber(value).toFixed(2));

const khaltiAmountToNpr = (totalAmount) => {
  return roundMoney(toNumber(totalAmount) / 100);
};

export const verifyPayment = async (pidx) => {
  if (!pidx) {
    throw new ApiError(400, "pidx is required for verification");
  }

  const khaltiRes = await verifyKhalti(pidx);

  if (khaltiRes.status !== "Completed") {
    throw new ApiError(400, "Payment not completed");
  }

  const paidAmountNPR = khaltiAmountToNpr(khaltiRes.total_amount);

  if (paidAmountNPR <= 0) {
    throw new ApiError(400, "Invalid Khalti paid amount");
  }

  const session = await mongoose.startSession();

  try {
    let responsePayload = null;

    await session.withTransaction(async () => {
      const txn = await Transaction.findOne({
        "khalti.pidx": pidx,
      }).session(session);

      if (!txn) {
        throw new ApiError(
          404,
          "Transaction not found for this Khalti payment",
        );
      }

      const nfcCard = await NfcCard.findById(txn.nfcCard).session(session);

      if (!nfcCard) {
        throw new ApiError(404, "NFC card not found");
      }

      if (txn.status === "completed") {
        const existing = txn.toObject();
        existing.finalNfcBalance = roundMoney(nfcCard.balance);
        responsePayload = existing;
        return;
      }

      const previousBalance = roundMoney(nfcCard.balance);

      /**
       * Important:
       * Only deduct fare when this Khalti payment belongs to a real trip.
       * Pending tap transactions store txn.trip + txn.fare in NPR.
       * Generic top-up transactions should have fare = 0 and no trip.
       */
      const fareToDeduct =
        txn.trip && toNumber(txn.fare) > 0 ? roundMoney(txn.fare) : 0;

      nfcCard.balance = roundMoney(
        previousBalance + paidAmountNPR - fareToDeduct,
      );

      if (nfcCard.balance < 0) {
        nfcCard.balance = 0;
      }

      await nfcCard.save({ session });

      let completedTrip = null;

      if (fareToDeduct > 0 && txn.trip) {
        const trip = await Trip.findById(txn.trip).session(session);

        if (!trip) {
          throw new ApiError(404, "Linked trip not found");
        }

        const wasAlreadyCompleted = Boolean(trip.completed);

        if (!trip.completed) {
          trip.completed = true;

          if (!trip.exitTime) {
            trip.exitTime = new Date();
          }

          if (!trip.fare) {
            trip.fare = fareToDeduct;
          }

          await trip.save({ session });
        }

        completedTrip = trip;

        /**
         * The immediate NFC-payment path already updates Bus, Driver, and Operator counters.
         * This does the same for trips that were completed only after Khalti top-up.
         */
        if (!wasAlreadyCompleted) {
          const counterUpdates = [];

          if (trip.busId) {
            counterUpdates.push(
              Bus.findByIdAndUpdate(
                trip.busId,
                {
                  $inc: {
                    totalTrips: 1,
                    totalRevenue: fareToDeduct,
                  },
                },
                { session },
              ),
            );
          }

          if (trip.driver) {
            counterUpdates.push(
              Driver.findByIdAndUpdate(
                trip.driver,
                {
                  $inc: {
                    totalTrips: 1,
                    totalRevenue: fareToDeduct,
                  },
                },
                { session },
              ),
            );
          }

          if (trip.operator) {
            counterUpdates.push(
              Operator.findByIdAndUpdate(
                trip.operator,
                {
                  $inc: {
                    totalRevenue: fareToDeduct,
                  },
                },
                { session },
              ),
            );
          }

          await Promise.all(counterUpdates);
        }

        if (!txn.busId && trip.busId) {
          txn.busId = trip.busId;
        }

        if (!txn.operator && trip.operator) {
          txn.operator = trip.operator;
        }

        if (!txn.driver && trip.driver) {
          txn.driver = trip.driver;
        }
      }

      if (txn.passenger) {
        await User.findByIdAndUpdate(
          txn.passenger,
          { onBoard: false },
          { session },
        );
      }

      txn.status = "completed";
      txn.paymentMethod = txn.paymentMethod || "khalti_auto";
      txn.description =
        txn.description ||
        (fareToDeduct > 0
          ? "Khalti top-up completed and fare deducted"
          : "Khalti top-up completed");

      txn.khalti = txn.khalti || {};
      txn.khalti.status = "completed";
      txn.khalti.transactionId =
        khaltiRes.transaction_id || txn.khalti.transactionId;
      txn.khalti.amount = paidAmountNPR;

      await txn.save({ session });

      const result = txn.toObject();

      responsePayload = {
        ...result,
        paidAmount: paidAmountNPR,
        fareDebited: fareToDeduct,
        previousNfcBalance: previousBalance,
        finalNfcBalance: roundMoney(nfcCard.balance),
        completedTripId: completedTrip?._id || null,
      };
    });

    return responsePayload;
  } finally {
    session.endSession();
  }
};
