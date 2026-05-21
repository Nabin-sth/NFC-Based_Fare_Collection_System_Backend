import cors from "cors";
import cookieParser from "cookie-parser";
import express, { urlencoded } from "express";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger.js";
import { handleTap } from "./controller/tap.controller.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestTiming } from "./middleware/requestTiming.middleware.js";
import { sanitize } from "./middleware/sanitization.middleware.js";
import { validate } from "./middleware/validate.middleware.js";
import adminRoute from "./router/admin.route.js";
import busLocationRoute from "./router/busLocation.routes.js";
import driverRoute from "./router/driver.route.js";
import healthRoute from "./router/health.route.js";
import nfcRoute from "./router/nfc.route.js";
import operatorRoute from "./router/operator.router.js";
import paymentRoute from "./router/payment.routes.js";
import userRoute from "./router/user.route.js";
import { tapSchema } from "./validation/tap.validation.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(morgan("combined"));
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));
app.use(express.static("public"));
app.use(requestTiming);
app.use(sanitize);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use("/api/v1/users", userRoute);
app.use("/api/v1/users/payment", paymentRoute);
app.post("/api/v1/user/tap", validate(tapSchema), handleTap);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/operator", operatorRoute);
app.use("/api/v1/nfc", nfcRoute);
app.use("/api/v1/driver", driverRoute);
app.use("/api/v1/bus", busLocationRoute);
app.use("/api/v1/buses", busLocationRoute);

// Optional legacy support for ESP32 devices that still post to /bus/update-location.
app.use("/bus", busLocationRoute);

app.use("/api/v1", healthRoute);
app.use(errorHandler);

export default app;
