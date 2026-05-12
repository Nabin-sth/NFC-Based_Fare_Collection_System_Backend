import { Router } from "express";

import { getRecentDriverTapEvents } from "../controller/driverTapEvent.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireDriver } from "../middleware/role.middleware.js";

const router = Router();

router.use(verifyJWT, requireDriver);

router.route("/tap-events/recent").get(getRecentDriverTapEvents);

export default router;
