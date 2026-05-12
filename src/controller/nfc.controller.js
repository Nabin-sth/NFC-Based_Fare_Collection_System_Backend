import { NfcCard } from "../model/Nfc.model.js";
import { User } from "../model/user.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  formatNfcCardForResponse,
  normalizeCardUid,
} from "../utils/nfc.utils.js";

const registerNfcCard = asyncHandler(async (req, res) => {
  const { cardUid, cardType = "personal" } = req.body;
  const userId = req.user?._id;

  if (!cardUid) {
    throw new ApiError(400, "Card UID is required");
  }

  const normalizedUid = normalizeCardUid(cardUid);

  const existingCard = await NfcCard.findOne({ cardUid: normalizedUid });

  if (existingCard) {
    if (existingCard.user.toString() !== userId.toString()) {
      throw new ApiError(403, "This card is already registered to another user");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        formatNfcCardForResponse(existingCard),
        "Card already registered",
      ),
    );
  }

  const newCard = await NfcCard.create({
    cardUid: normalizedUid,
    user: userId,
    cardType,
    isVerified: false,
    status: "active",
  });

  await User.updateOne(
    { _id: userId, defaultNfcCard: null },
    { $set: { defaultNfcCard: newCard._id } },
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      formatNfcCardForResponse(newCard),
      "NFC card registered! Waiting for admin verification",
    ),
  );
});

const requestNfcBlock = asyncHandler(async (req, res) => {
  const { cardId, reason } = req.body;
  const userId = req.user?._id;

  const query = {
    user: userId,
    ...(cardId ? { _id: cardId } : {}),
  };

  if (!cardId && req.user?.defaultNfcCard) {
    query._id = req.user.defaultNfcCard;
  }

  const card = await NfcCard.findOne(query);

  if (!card) {
    throw new ApiError(404, "NFC card not found");
  }

  if (card.status === "blocked" || card.isActive === false) {
    return res.status(200).json(
      new ApiResponse(
        200,
        formatNfcCardForResponse(card),
        "NFC card is already blocked",
      ),
    );
  }

  if (card.status === "block_requested") {
    return res.status(200).json(
      new ApiResponse(
        200,
        formatNfcCardForResponse(card),
        "NFC card block request is already pending",
      ),
    );
  }

  card.status = "block_requested";
  card.blockRequestedAt = new Date();
  card.blockRequestReason =
    reason?.toString().trim() || "Requested from passenger app";

  await card.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      formatNfcCardForResponse(card),
      "NFC card block request submitted",
    ),
  );
});

export { registerNfcCard, requestNfcBlock };
