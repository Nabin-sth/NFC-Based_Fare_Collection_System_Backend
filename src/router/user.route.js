import { Router } from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  registerDriver,
  loginDriver,
  getDriverProfile,
  registerOperator,
  loginOperator,
  getOperatorProfile,
  refreshAccessToken,
} from "../controller/user.auth.controller.js";

import {
  registerVehicle,
  getOperatorVehicles,
  getVehicleDetails,
  updateVehicleStatus,
  updateVehicleLocation,
  deleteVehicle,
} from "../controller/vechicle.controller.js";

// ── Middleware ─────────────────────────────────────────────
import { verifyJWT } from "../middleware/auth.middleware.js";
import { sanitize } from "../middleware/sanitization.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  requireOperator,
  requireDriver,
  requireAdmin,
} from "../middleware/role.middleware.js";

// ── Validation schemas ─────────────────────────────────────
import {
  userRegisterSchema,
  userLoginSchema,
} from "../validation/user.validation.js";
import { driverRegisterSchema } from "../validation/driver.validation.js";
import {
  operatorRegisterSchema,
  operatorLoginSchema,
} from "../validation/operator.validation.js";
import {
  vehicleRegisterSchema,
  vehicleUpdateLocationSchema,
} from "../validation/vechile.validation.js";
import { nfcCardSchema } from "../validation/NfcCard.validation.js";
const router = Router();

// PASSENGER ROUTES

// POST  /api/user/register
router
  .route("/user/register")
  .post(sanitize, validate(userRegisterSchema), registerUser);

// POST  /api/user/login
router
  .route("/user/login")
  .post(sanitize, validate(userLoginSchema), loginUser);

// POST  /api/user/logout         [auth required]
router.route("/user/logout").post(verifyJWT, logoutUser);

// DRIVER ROUTES

// POST  /api/driver/register
router
  .route("/driver/register")
  .post(sanitize, validate(driverRegisterSchema), registerDriver);

// POST  /api/driver/login
router
  .route("/driver/login")
  .post(sanitize, validate(userLoginSchema), loginDriver);

// GET   /api/driver/profile      [driver auth required]
router.route("/driver/profile").get(verifyJWT, requireDriver, getDriverProfile);

// POST  /api/driver/logout       [auth required]
router.route("/driver/logout").post(verifyJWT, logoutUser);

// OPERATOR ROUTES

// POST  /api/operator/register
router
  .route("/operator/register")
  .post(sanitize, validate(operatorRegisterSchema), registerOperator);

// POST  /api/operator/login
router
  .route("/operator/login")
  .post(sanitize, validate(operatorLoginSchema), loginOperator);

// GET   /api/operator/profile    [operator auth required]
router
  .route("/operator/profile")
  .get(verifyJWT, requireOperator, getOperatorProfile);

// POST  /api/operator/logout     [auth required]
router.route("/operator/logout").post(verifyJWT, logoutUser);

// ══════════════════════════════════════════════════════════
// VEHICLE ROUTES
// ══════════════════════════════════════════════════════════

// POST  /api/vehicle/register    [operator auth required]
// PATCH /api/vehicle/:busId/location  [driver of bus or operator]
router
  .route("/vehicle/:busId/location")
  .patch(
    verifyJWT,
    sanitize,
    validate(vehicleUpdateLocationSchema),
    updateVehicleLocation,
  );

// SHARED / UTILITY ROUTES

// POST  /api/auth/refresh-token
router.route("/auth/refresh-token").post(refreshAccessToken);

router.route("/profile").get(verifyJWT, async (req, res) => {
  try {
    const user = req.user;

    const cardId = user.defaultNfcCard || user.default_card;
    const nfcCard = cardId
      ? await NfcCard.findById(cardId)
      : await NfcCard.findOne({ user: user._id }).sort({ createdAt: -1 });

    if (!nfcCard) {
      return res.status(404).json({
        success: false,
        message: "NFC card not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user._doc,
        balance: nfcCard.balance,
        cardUid: maskCardUid(nfcCard.cardUid),
        maskedCardUid: maskCardUid(nfcCard.cardUid),
        nfcCardId: nfcCard._id,
        cardStatus: nfcCard.status || (nfcCard.isActive ? "active" : "blocked"),
        cardType: nfcCard.cardType,
        isNfcCardActive: nfcCard.isActive,
        isNfcCardVerified: nfcCard.isVerified,
        blockRequestedAt: nfcCard.blockRequestedAt,
        blockRequestReason: nfcCard.blockRequestReason,
        blockedAt: nfcCard.blockedAt,
        nfcCard: {
          id: nfcCard._id,
          _id: nfcCard._id,
          cardUid: maskCardUid(nfcCard.cardUid),
          maskedCardUid: maskCardUid(nfcCard.cardUid),
          status: nfcCard.status || (nfcCard.isActive ? "active" : "blocked"),
          cardType: nfcCard.cardType,
          isActive: nfcCard.isActive,
          isVerified: nfcCard.isVerified,
          blockRequestedAt: nfcCard.blockRequestedAt,
          blockRequestReason: nfcCard.blockRequestReason,
          blockedAt: nfcCard.blockedAt,
        },
      },
      message: "Profile successfully fetched",
    });
  } catch (error) {
    console.error("error while fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});
import { registerNfcCard } from "../controller/nfc.controller.js";
import { NfcCard } from "../model/Nfc.model.js";
import { maskCardUid } from "../utils/nfc.utils.js";
router
  .route("/register")
  .post(sanitize, validate(userRegisterSchema), registerUser);
router.route("/login").post(sanitize, validate(userLoginSchema), loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router
  .route("/registerNfc")
  .post(sanitize, verifyJWT, validate(nfcCardSchema), registerNfcCard);

export default router;
