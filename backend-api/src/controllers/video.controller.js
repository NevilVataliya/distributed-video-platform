import { Video } from "../models/Video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";
// import { uploadToMinIO } from "../utils/minio.js";

import { publishToQueue } from "../utils/rabbitmq.js";

const uploadVideo = asyncHandler(async(req , res )=>{
    const file = req.file;

    if (!file) {
        throw new ApiError(400,"No file uploaded")
    }


    const objectName = `${Date.now()}-${file.originalname}`;
    // await uploadToMinIO("raw-videos", objectName, file.buffer);


    const video = await Video.create({
      title: file.originalname,
      status: "Processing",
      streamKey: crypto.randomBytes(8).toString("hex"),
    });

    await publishToQueue("video-processing",{
      videoId: video._id.toString(),
      objectName,
    });

    return res.status(200).json({
      message: "Processing",
      videoId: video._id.toString()
    });
});

export { uploadVideo };