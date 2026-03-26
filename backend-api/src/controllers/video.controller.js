import { Video } from "../models/Video.model.js";
import { User } from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadToMinIO } from "../utils/minio.js";

import { publishToQueue } from "../utils/rabbitmq.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Dummy image functions
const uploadImage = async (buffer) => {
    return `dummy-thumbnail-url-${Date.now()}.jpg`;
};

const deleteImage = async (imageUrl) => {
    console.log(`Deleted image: ${imageUrl}`);
};

const uploadVideo = asyncHandler(async(req , res )=>{
    const videoFile = req.files?.video?.[0] || req.file;
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
        throw new ApiError(400,"No video file uploaded")
    }

    let thumbnailUrl = "";
    if (thumbnailFile) {
        thumbnailUrl = await uploadImage(thumbnailFile.buffer);
    }

    const objectName = `${Date.now()}-${videoFile.originalname}`;
    await uploadToMinIO(videoFile.buffer, objectName);


    const video = await Video.create({
      title: videoFile.originalname,
      status: "Processing",
      thumbnail: thumbnailUrl
    });

    await publishToQueue("video-processing",{
      videoId: video._id.toString(),
      objectName,
    });

    return res.status(200).json({
      message: "Processing",
      videoId: video._id.toString(),
      thumbnail: thumbnailUrl
    });
});

const webhookUpdate= asyncHandler(async(req,res)=>{
  const {videoId,status,hlsUrl}=req.body
  const video = await Video.findById(videoId)
  if(!video){
    throw new ApiError(404,"Video not found")
  }
  video.status = status
  video.hlsUrl=hlsUrl
  const updatedV = await video.save();

  // console.log("Webhook received for videoId:", videoId, "Status:", status, "HLS URL:", hlsUrl);
  // console.log("Updated video document:", updatedV);

  if(!updatedV){
    throw new ApiError(500,"Unable to update status and hls ")
  }
  return res.status(201).json(
    new ApiResponse(200,updatedV,"Successfully updated the status and hls")
  )
})

const streamAuth= asyncHandler(async(req,res)=>{
  const {name} = req.body  //check

  const user = await User.findOne({streamKey:name});
  if(!user){
    return res.sendStatus(401);
  }
  return res.sendStatus(200);
})

const getVideoStatus = asyncHandler(async(req,res)=>{
  const videoId = req.params.id;
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404, "Video not found ");
  }
  return res.status(201).json(
    {
      status:video.status,
      hlsUrl:video.hlsUrl
    }
  )
})

const getAllReadyVideo = asyncHandler(async(req,res)=>{
  const videos  = await Video.find({status:"Ready"}).sort({uploadDate:-1});
  if(!videos){
    throw new ApiError(400,"some error occured or no video is ready")
  }
  return res.json(videos);

})

const updateThumbnail = asyncHandler(async(req,res)=>{
    const videoId = req.params.id;
    const file = req.file;

    if (!file) {
        throw new ApiError(400, "No thumbnail file uploaded");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.thumbnail) {
        await deleteImage(video.thumbnail);
    }

    const newThumbnailUrl = await uploadImage(file.buffer);
    
    video.thumbnail = newThumbnailUrl;
    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Thumbnail updated successfully")
    );
});

export { uploadVideo,streamAuth,getAllReadyVideo,getVideoStatus,webhookUpdate,updateThumbnail };