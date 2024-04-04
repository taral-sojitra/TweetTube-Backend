import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Healthcheck endpoint
const healthcheck = asyncHandler(async (_, res) => {
  // Check if process is available
  if (!process) {
    return res.status(500).json(new ApiResponse(500, null, "Process is not available"));
  }

  // Build healthcheck data
  const data = {
    uptime: process.uptime(),
    date: new Date(),
  };

  // Send response
  return res.status(200).json(new ApiResponse(200, data, "OK"));
});

export { healthcheck };

// import { ApiError } from "../utils/ApiError.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
// import { asyncHandler } from "../utils/asyncHandler.js";

// const healthcheck = asyncHandler(async (_, res) => {
//   // eslint-disable-next-line no-undef
//   if (!process) {
//     throw new ApiError(500, "Your proccess is not setup yet");
//   }

//   const data = {
//     uptime: process.uptime(),
//     date: new Date(),
//   };

//   res.status(200).send(new ApiResponse(200, data, "Ok"));
// });

// export { healthcheck };
