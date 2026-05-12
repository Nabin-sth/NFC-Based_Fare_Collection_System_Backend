import {Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { sanitize } from "../middleware/sanitization.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { roleSchema } from "../validation/role.validation.js";
import {
  blockNfcCard,
  deleteUser,
  getAllData,
  getNfcBlockRequests,
  getPendingNfcCard,
  rejectNfcBlock,
  rejectNfcCard,
  removeRole,
  unblockNfcCard,
  updateRoleByAdmin,
  verifyNfcCard,
  verifyUserByAdmin,
} from "../controller/admin.controller.js";
const router = Router();
router.route("/get-all-data").get(verifyJWT,requireAdmin,getAllData)
router.route("/update-role/:userId").patch(verifyJWT,requireAdmin,sanitize,validate(roleSchema),updateRoleByAdmin)
router.route("/verify-user/:userId").patch(verifyJWT,requireAdmin,sanitize,verifyUserByAdmin)
router.route("/remove-role/:userId").patch(verifyJWT,requireAdmin,sanitize,validate(roleSchema),removeRole)
router.route("/delete-user/:userId").delete(verifyJWT,requireAdmin,sanitize,deleteUser)
router.route("/pending").get(verifyJWT,requireAdmin,getPendingNfcCard)
router.route("/verify/:id").patch(verifyJWT,requireAdmin,verifyNfcCard)
router.route("/reject/:id").delete(verifyJWT,requireAdmin,rejectNfcCard);
router.route("/nfc/block-requests").get(verifyJWT,requireAdmin,getNfcBlockRequests);
router.route("/nfc/:cardId/block").patch(verifyJWT,requireAdmin,blockNfcCard);
router.route("/nfc/:cardId/reject-block").patch(verifyJWT,requireAdmin,rejectNfcBlock);
router.route("/nfc/:cardId/unblock").patch(verifyJWT,requireAdmin,unblockNfcCard);
export default router;
