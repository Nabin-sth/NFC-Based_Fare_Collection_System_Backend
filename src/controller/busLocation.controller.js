import mongoose from "mongoose";

import { Operator } from "../model/operator.model.js";
import { Bus } from "../model/vechile.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const isValidLatLng = (lat, lng) => {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const assertDeviceAllowed = (req) => {
  /**
   * Optional but recommended.
   *
   * Add this to .env:
   * ESP32_GPS_API_KEY=your-secret-key
   *
   * If ESP32_GPS_API_KEY is not set, the route works without the key.
   * For production, set it.
   */
  const expectedKey = process.env.ESP32_GPS_API_KEY;

  if (!expectedKey) return;

  const providedKey =
    req.header("x-device-key") ||
    req.header("X-Device-Key") ||
    req.body?.deviceKey;

  if (providedKey !== expectedKey) {
    throw new ApiError(401, "Unauthorized GPS device");
  }
};

const formatOperator = (operator) => {
  if (!operator) return null;

  if (operator instanceof mongoose.Types.ObjectId) {
    return operator;
  }

  if (typeof operator !== "object" || !operator._id) {
    return operator;
  }

  return {
    id: operator._id,
    _id: operator._id,
    companyName: operator.companyName,
    contact: operator.contact,
  };
};

const formatBusLocation = (bus) => {
  const timestamp = bus.currentLocation?.timestamp || bus.lastSeen || null;

  return {
    id: bus._id,
    _id: bus._id,

    plateNumber: bus.plateNumber,
    vehicleNumber: bus.plateNumber,

    busType: bus.busType,
    status: bus.status,

    maxCapacity: bus.maxCapacity,
    currentOccupancy: bus.currentOccupancy,

    currentLocation: {
      lat: bus.currentLocation?.lat ?? null,
      lng: bus.currentLocation?.lng ?? null,
      timestamp,
    },

    lastSeen: bus.lastSeen || timestamp,

    driver: bus.driver
      ? {
          id: bus.driver._id,
          licenseNumber: bus.driver.licenseNumber,
          status: bus.driver.status,
        }
      : null,

    operator: formatOperator(bus.operator),
  };
};

/**
 * GET /api/v1/buses/locations
 *
 * Returns buses that have valid currentLocation.
 * - Admin/passenger/driver: all live buses, preserving passenger compatibility.
 * - Operator: only buses belonging to the logged-in operator.
 *
 * Optional query:
 * - includeInactive=true | false
 * - status=running
 * - maxAgeMinutes=30
 */
export const getAllBusLocations = asyncHandler(async (req, res) => {
  const {
    includeInactive = "true",
    status,
    maxAgeMinutes,
  } = req.query;

  const match = {
    "currentLocation.lat": { $type: "number", $gte: -90, $lte: 90 },
    "currentLocation.lng": { $type: "number", $gte: -180, $lte: 180 },
  };

  if (status && String(status).trim()) {
    match.status = String(status).trim();
  }

  if (includeInactive !== "true") {
    match.status = match.status || { $ne: "inactive" };
  }

  const roles = req.user?.user_type || [];

  if (roles.includes("operator") && !roles.includes("admin")) {
    const operatorDoc = await Operator.findOne({ owner: req.user._id })
      .select("_id")
      .lean();

    if (!operatorDoc) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            count: 0,
            buses: [],
          },
          "Bus locations fetched successfully",
        ),
      );
    }

    match.operator = operatorDoc._id;
  }

  const maxAge = Number(maxAgeMinutes);
  if (Number.isFinite(maxAge) && maxAge > 0) {
    const since = new Date(Date.now() - maxAge * 60 * 1000);
    match.$or = [
      { lastSeen: { $gte: since } },
      { "currentLocation.timestamp": { $gte: since } },
    ];
  }

  const buses = await Bus.find(match)
    .select(
      "plateNumber busType status maxCapacity currentOccupancy currentLocation lastSeen driver operator",
    )
    .populate("driver", "licenseNumber status")
    .populate("operator", "companyName contact")
    .sort({ lastSeen: -1, "currentLocation.timestamp": -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: buses.length,
        buses: buses.map(formatBusLocation),
      },
      "Bus locations fetched successfully",
    ),
  );
});

/**
 * GET /api/v1/bus/:busId
 *
 * Keeps existing Flutter fetchBus(busId) working.
 */
export const getBusLocationById = asyncHandler(async (req, res) => {
  const { busId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(busId)) {
    throw new ApiError(400, "Invalid bus ID");
  }

  const bus = await Bus.findById(busId)
    .select(
      "plateNumber busType status maxCapacity currentOccupancy currentLocation lastSeen driver operator",
    )
    .populate("driver", "licenseNumber status")
    .lean();

  if (!bus) {
    throw new ApiError(404, "Bus not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formatBusLocation(bus),
        "Bus location fetched successfully",
      ),
    );
});

/**
 * POST /api/v1/bus/update-location
 * POST /bus/update-location
 *
 * Body from ESP32:
 * {
 *   "busId": "...",
 *   "lat": 28.254950,
 *   "lng": 83.976296
 * }
 */
export const updateBusLocationFromDevice = asyncHandler(async (req, res) => {
  assertDeviceAllowed(req);

  const { busId, lat, lng, latitude, longitude } = req.body;

  if (!busId || !mongoose.Types.ObjectId.isValid(busId)) {
    throw new ApiError(400, "Valid busId is required");
  }

  const parsedLat = toNumber(lat ?? latitude);
  const parsedLng = toNumber(lng ?? longitude);

  if (!isValidLatLng(parsedLat, parsedLng)) {
    throw new ApiError(400, "Invalid latitude or longitude");
  }

  const now = new Date();

  const bus = await Bus.findByIdAndUpdate(
    busId,
    {
      $set: {
        currentLocation: {
          lat: parsedLat,
          lng: parsedLng,
          timestamp: now,
        },
        lastSeen: now,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .select(
      "plateNumber busType status maxCapacity currentOccupancy currentLocation lastSeen driver operator",
    )
    .populate("driver", "licenseNumber status")
    .lean();

  if (!bus) {
    throw new ApiError(404, "Bus not found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        bus: formatBusLocation(bus),
      },
      "Bus location updated successfully",
    ),
  );
});
