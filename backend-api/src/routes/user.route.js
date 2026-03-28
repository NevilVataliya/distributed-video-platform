import { Router } from "express";
import { loginUser, logoutUser, registerUser , checkUsernameAvailability, getCurrentUser, getUserVideos, regenerateStreamKey} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/check-username").get(checkUsernameAvailability);
router.route("/me").get(verifyJWT,getCurrentUser)
router.route("/:username/videos").get(getUserVideos);
router.route("/streamkey/regenerate").post(verifyJWT, regenerateStreamKey);
export default router
