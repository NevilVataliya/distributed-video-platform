import { Router } from "express";
import { getAllReadyVideo, getVideoStatus, streamAuth, uploadVideo, webhookUpdate } from "../controllers/video.controller.js";
import multer from "multer";
const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 

router.route("/upload").post(upload.single("video"),uploadVideo)
router.route("/webhook").post(webhookUpdate)
router.route("/stream/auth").post(streamAuth)  // express.urlencoded({ extended: true })
router.route("/:id/status").get(getVideoStatus)
router.route("/").get(getAllReadyVideo)
export default router;