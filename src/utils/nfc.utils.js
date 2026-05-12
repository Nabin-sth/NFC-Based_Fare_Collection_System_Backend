export const normalizeCardUid = (cardUid) => {
  return cardUid?.toString().trim().toUpperCase();
};

export const maskCardUid = (cardUid) => {
  const uid = normalizeCardUid(cardUid);
  if (!uid) return null;
  if (uid.length <= 4) return `${uid[0] ?? ""}***${uid[uid.length - 1] ?? ""}`;

  const prefix = uid.slice(0, 2);
  const suffix = uid.slice(-2);
  const maskLength = Math.max(4, uid.length - 4);

  return `${prefix}${"*".repeat(maskLength)}${suffix}`;
};

export const formatNfcCardForResponse = (card) => {
  if (!card) return null;

  const raw = typeof card.toObject === "function" ? card.toObject() : card;
  const user = raw.user;

  return {
    id: raw._id,
    _id: raw._id,
    cardUid: maskCardUid(raw.cardUid),
    maskedCardUid: maskCardUid(raw.cardUid),
    cardType: raw.cardType,
    status: raw.status || (raw.isActive ? "active" : "blocked"),
    isActive: raw.isActive,
    isVerified: raw.isVerified,
    balance: raw.balance,
    requestedAt: raw.requestedAt,
    verifiedAt: raw.verifiedAt,
    lastUsedAt: raw.lastUsedAt,
    blockRequestedAt: raw.blockRequestedAt,
    blockRequestReason: raw.blockRequestReason,
    blockedAt: raw.blockedAt,
    blockRejectedAt: raw.blockRejectedAt,
    unblockedAt: raw.unblockedAt,
    user:
      user && typeof user === "object"
        ? {
            id: user._id,
            _id: user._id,
            FirstName: user.FirstName,
            email: user.email,
            phone: user.phone,
            nid: user.nid,
          }
        : user,
  };
};
