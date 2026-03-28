import { Router } from "express";
import { getAllReadyVideo, getVideoStatus, streamAuth, uploadVideo, getVideoById, updateVideoDetails, deleteVideo, incrementVideoViews } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.js";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 

router.route("/upload").post(
    verifyJWT,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 }
    ]),
    uploadVideo
)
router.route("/stream/auth").post(streamAuth)  // express.urlencoded({ extended: true })
router.route("/:id/status").get(getVideoStatus)
router.route("/").get(getAllReadyVideo)
router.route("/:id").get(getVideoById)
router.route("/:id/view").post(incrementVideoViews)
router.route("/:id").patch(verifyJWT, upload.single("thumbnail"), updateVideoDetails)
router.route("/:id").delete(verifyJWT, deleteVideo)

export default router;