import { Router } from "express";
import healthcheck from "../controller/healthcheck.controller.js";

const route = Router();
route.get("/health", healthcheck);
export default route;
