import mongoose from "mongoose";

import { Bus } from "../model/vechile.model.js";
import { Driver } from "../model/driver.model.js";
import { TapEvent } from "../model/TapEvent.model.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const passengerIdentifier = (passengerId) => {
  if (!passengerId) return null;
  const value = passengerId.toString();
  return `Passenger ${value.slice(-6).toUpperCase()}`;
};

const formatTapEvent = (event) => ({
  id: event._id,
  _id: event._id,
  timestamp: event.createdAt,
  eventType: event.eventType,
  tapType: event.eventType,
  status: event.status,
  success: event.success,
  message: event.message,
  fare: event.fare || 0,
  maskedCardUid: event.maskedCardUid,
  passengerIdentifier: passengerIdentifier(event.passenger),
  busPlate: event.busPlate,
  failureReason: event.failureReason,
});

export const getRecentDriverTapEvents = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

  const driver = await Driver.findOne({ user: req.user._id }).lean();
  if (!driver) throw new ApiError(404, "Driver profile not found");

  let assignedBusId = driver.assignedBus;

  if (!assignedBusId) {
    const assignedBus = await Bus.findOne({ driver: driver._id })
      .select("_id")
      .lean();
    assignedBusId = assignedBus?._id;
  }

  if (!assignedBusId || !mongoose.Types.ObjectId.isValid(assignedBusId)) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          count: 0,
          events: [],
        },
        "No assigned bus found for this driver",
      ),
    );
  }

  const events = await TapEvent.find({ bus: assignedBusId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        count: events.length,
        events: events.map(formatTapEvent),
      },
      "Recent tap events fetched successfully",
    ),
  );
});
