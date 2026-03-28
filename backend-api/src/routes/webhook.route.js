import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { webhookUpdate,webhookStreamStart,webhookStreamEnd } from "../controllers/webhook.controller.js";
const router = Router()

router.route("/processing-done").post(webhookUpdate);
router.route("/stream-start").post(webhookStreamStart);
router.route("/stream-end").post(webhookStreamEnd);

export default router;