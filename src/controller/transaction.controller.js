import mongoose from "mongoose";

import { Transaction } from "../model/Transaction.model.js";
import { NfcCard } from "../model/Nfc.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const roundMoney = (value) => Number(toNumber(value).toFixed(2));

const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const parseDateQuery = (value, fieldName) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Invalid ${fieldName} date`);
  }

  return date;
};

const buildDateMatch = (query) => {
  const from = parseDateQuery(query.from, "from");
  const to = parseDateQuery(query.to, "to");

  if (!from && !to) return null;

  const match = {};

  if (from) match.$gte = from;
  if (to) match.$lte = to;

  return match;
};

const getDisplayDate = (transaction, amountCreditedUsingKhalti) => {
  if (amountCreditedUsingKhalti > 0) {
    return transaction.updatedAt || transaction.createdAt;
  }

  return (
    transaction.tapOut?.time || transaction.tapIn?.time || transaction.createdAt
  );
};

const getBusInfo = (transaction) => {
  const bus = transaction.busId || transaction.trip?.busId;

  if (!bus || typeof bus !== "object") {
    return null;
  }

  return {
    id: bus._id,
    plateNumber: bus.plateNumber || null,
    busType: bus.busType || null,
  };
};

const getType = ({
  fareDebited,
  amountCreditedUsingKhalti,
  transactionStatus,
  khaltiStatus,
}) => {
  if (fareDebited > 0 && amountCreditedUsingKhalti > 0) {
    return "fare_and_khalti";
  }

  if (amountCreditedUsingKhalti > 0 || khaltiStatus === "completed") {
    return "khalti_credit";
  }

  if (fareDebited > 0) {
    return "fare_debit";
  }

  if (
    transactionStatus === "payment_required" ||
    transactionStatus === "payment_initiated"
  ) {
    return "payment_pending";
  }

  if (transactionStatus === "failed" || khaltiStatus === "failed") {
    return "failed";
  }

  if (transactionStatus === "refunded" || khaltiStatus === "refunded") {
    return "refund";
  }

  return "transaction";
};

const formatTransaction = (transaction) => {
  const khaltiStatus = transaction.khalti?.status || null;

  /**
   * Fare should only appear as debited when the transaction is completed.
   * A payment_required transaction contains fare, but fare has not finally
   * settled until payment succeeds.
   */
  const fareDebited =
    transaction.status === "completed" && toNumber(transaction.fare) > 0
      ? roundMoney(transaction.fare)
      : 0;

  /**
   * Store khalti.amount in NPR in your DB.
   * Khalti API uses paisa, but this field should be normalized before saving.
   */
  const amountCreditedUsingKhalti =
    khaltiStatus === "completed" ? roundMoney(transaction.khalti?.amount) : 0;

  const date = getDisplayDate(transaction, amountCreditedUsingKhalti);

  return {
    id: transaction._id,
    txnId: transaction.txnId,
    date,

    type: getType({
      fareDebited,
      amountCreditedUsingKhalti,
      transactionStatus: transaction.status,
      khaltiStatus,
    }),

    status: transaction.status,

    // Required frontend fields
    fareDebited,
    amountCreditedUsingKhalti,

    // Extra display fields
    requiredTopup: roundMoney(transaction.requiredTopup),
    isAutoTopup: Boolean(transaction.isAutoTopup),
    paymentMethod: transaction.paymentMethod || null,
    description: transaction.description || null,

    khalti: {
      pidx: transaction.khalti?.pidx || null,
      transactionId: transaction.khalti?.transactionId || null,
      status: khaltiStatus,
      amount: amountCreditedUsingKhalti,
      paymentUrl: transaction.khalti?.payment_url || null,
    },

    nfcCard: transaction.nfcCard
      ? {
          id: transaction.nfcCard._id,
          cardUid: transaction.nfcCard.cardUid || null,
        }
      : null,

    trip: transaction.trip
      ? {
          id: transaction.trip._id,
          fare: roundMoney(transaction.trip.fare),
          completed: Boolean(transaction.trip.completed),
          entryTime: transaction.trip.entryTime || null,
          exitTime: transaction.trip.exitTime || null,
        }
      : null,

    bus: getBusInfo(transaction),

    tapIn: {
      time: transaction.tapIn?.time || null,
      location: transaction.tapIn?.location || null,
    },

    tapOut: {
      time: transaction.tapOut?.time || null,
      location: transaction.tapOut?.location || null,
    },
  };
};

/**
 * GET /api/v1/users/payment/transactions
 *
 * Query params:
 * - page=1
 * - limit=20
 * - type=all | fare | khalti | pending | failed | refunded
 * - from=2026-01-01
 * - to=2026-01-31
 * - sort=desc | asc
 */
export const getMyTransactionHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(401, "Unauthorized request");
  }

  const page = parsePositiveInt(req.query.page, 1, 100000);
  const limit = parsePositiveInt(req.query.limit, 20, 100);
  const skip = (page - 1) * limit;

  const type = String(req.query.type || "all").toLowerCase();
  const sortDirection =
    String(req.query.sort || "desc").toLowerCase() === "asc" ? 1 : -1;

  const allowedTypes = new Set([
    "all",
    "fare",
    "khalti",
    "pending",
    "failed",
    "refunded",
  ]);

  if (!allowedTypes.has(type)) {
    throw new ApiError(
      400,
      "Invalid type. Allowed values: all, fare, khalti, pending, failed, refunded",
    );
  }

  /**
   * Some transactions have passenger.
   * Some may only be reliably connected through nfcCard.
   */
  const userCards = await NfcCard.find({ user: userId }).select("_id").lean();
  const cardIds = userCards.map((card) => card._id);

  const ownershipMatch = {
    $or: [
      { passenger: userId },
      ...(cardIds.length > 0 ? [{ nfcCard: { $in: cardIds } }] : []),
    ],
  };

  const andMatch = [ownershipMatch];

  const dateMatch = buildDateMatch(req.query);
  if (dateMatch) {
    andMatch.push({ createdAt: dateMatch });
  }

  switch (type) {
    case "fare":
      andMatch.push({
        status: "completed",
        fare: { $gt: 0 },
      });
      break;

    case "khalti":
      andMatch.push({
        "khalti.status": "completed",
      });
      break;

    case "pending":
      andMatch.push({
        status: { $in: ["payment_required", "payment_initiated"] },
      });
      break;

    case "failed":
      andMatch.push({
        $or: [{ status: "failed" }, { "khalti.status": "failed" }],
      });
      break;

    case "refunded":
      andMatch.push({
        $or: [{ status: "refunded" }, { "khalti.status": "refunded" }],
      });
      break;

    case "all":
    default:
      break;
  }

  const match = andMatch.length === 1 ? ownershipMatch : { $and: andMatch };

  const [transactions, total, summaryRows] = await Promise.all([
    Transaction.find(match)
      .populate("nfcCard", "cardUid")
      .populate("busId", "plateNumber busType")
      .populate({
        path: "trip",
        select: "entryTime exitTime fare completed busId",
        populate: {
          path: "busId",
          select: "plateNumber busType",
        },
      })
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean(),

    Transaction.countDocuments(match),

    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,

          totalFareDebited: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "completed"] },
                    { $gt: [{ $ifNull: ["$fare", 0] }, 0] },
                  ],
                },
                "$fare",
                0,
              ],
            },
          },

          totalKhaltiCredited: {
            $sum: {
              $cond: [
                { $eq: ["$khalti.status", "completed"] },
                { $ifNull: ["$khalti.amount", 0] },
                0,
              ],
            },
          },

          totalPendingTopup: {
            $sum: {
              $cond: [
                {
                  $in: ["$status", ["payment_required", "payment_initiated"]],
                },
                { $ifNull: ["$requiredTopup", 0] },
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const summary = summaryRows[0] || {
    totalFareDebited: 0,
    totalKhaltiCredited: 0,
    totalPendingTopup: 0,
  };

  const totalFareDebited = roundMoney(summary.totalFareDebited);
  const totalKhaltiCredited = roundMoney(summary.totalKhaltiCredited);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),

        summary: {
          totalFareDebited,
          totalKhaltiCredited,
          totalPendingTopup: roundMoney(summary.totalPendingTopup),
          netAmount: roundMoney(totalKhaltiCredited - totalFareDebited),
        },

        transactions: transactions.map(formatTransaction),
      },
      "Transaction history fetched successfully",
    ),
  );
});
