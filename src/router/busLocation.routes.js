import { Router } from "express";

import {
  getAllBusLocations,
  getBusLocationById,
  updateBusLocationFromDevice,
} from "../controller/busLocation.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { sanitize } from "../middleware/sanitization.middleware.js";

const router = Router();

// Must come before "/:busId"
router.get("/locations", sanitize, verifyJWT, getAllBusLocations);

// ESP32 hardware update endpoint
router.post("/update-location", sanitize, updateBusLocationFromDevice);

// Existing Flutter single-bus fetch endpoint
router.get("/:busId", sanitize, getBusLocationById);

export default router;
