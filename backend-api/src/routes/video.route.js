import { Router } from "express";
import { uploadVideo } from "../controllers/video.controller.js";
import multer from "multer";
const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); 

router.route("/upload").post(upload.single("video"),uploadVideo)

export default router;