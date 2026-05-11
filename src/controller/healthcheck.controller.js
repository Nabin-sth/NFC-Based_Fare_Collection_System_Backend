import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  console.log("Healthcheck route executed!"); // Log to confirm the function is called
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: "data",
      },
      "ok Healthcheck passed",
    ),
  );
});

export default healthcheck;
