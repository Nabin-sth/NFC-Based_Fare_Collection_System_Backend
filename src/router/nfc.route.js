import { Router } from "express";

import { requestNfcBlock } from "../controller/nfc.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requirePassenger } from "../middleware/role.middleware.js";
import { sanitize } from "../middleware/sanitization.middleware.js";

const router = Router();

router
  .route("/block-request")
  .post(verifyJWT, requirePassenger, sanitize, requestNfcBlock);

export default router;
