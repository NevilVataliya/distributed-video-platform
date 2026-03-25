import { Video } from "../models/Video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";
import { uploadToMinIO } from "../utils/minio.js";

import { publishToQueue } from "../utils/rabbitmq.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadVideo = asyncHandler(async(req , res )=>{
    const file = req.file;

    if (!file) {
        throw new ApiError(400,"No file uploaded")
    }


    const objectName = `${Date.now()}-${file.originalname}`;
    await uploadToMinIO(file.buffer, objectName);


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

const webhookUpdate= asyncHandler(async(req,res)=>{
  const {videoId,status,hlsUrl}=req.body
  const video = await Video.findById(videoId)
  if(!video){
    throw new ApiError(404,"Video not found")
  }
  video.status = status
  video.hlsUrl=hlsUrl
  const updatedV = await video.save();
  if(!updatedV){
    throw new ApiError(500,"Unable to update status and hls ")
  }
  return res.status(201).json(
    new ApiResponse(200,updatedV,"Successfully updated the status and hls")
  )
})

const streamAuth= asyncHandler(async(req,res)=>{
  const {name} = req.body  //check

  const video = await Video.findOne({streamKey:name});
  if(!video){
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

export { uploadVideo,streamAuth,getAllReadyVideo,getVideoStatus,webhookUpdate };