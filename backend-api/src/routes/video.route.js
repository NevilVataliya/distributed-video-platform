import { Router } from "express";
import { getAllReadyVideo, getVideoStatus, streamAuth, uploadVideo, webhookUpdate, updateThumbnail } from "../controllers/video.controller.js";
import multer from "multer";
const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 

router.route("/upload").post(
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    uploadVideo
)
router.route("/webhook").post(webhookUpdate)
router.route("/stream/auth").post(streamAuth)  // express.urlencoded({ extended: true })
router.route("/:id/status").get(getVideoStatus)
router.route("/").get(getAllReadyVideo)
router.route("/:id/thumbnail").patch(upload.single("thumbnail"), updateThumbnail)
export default router;