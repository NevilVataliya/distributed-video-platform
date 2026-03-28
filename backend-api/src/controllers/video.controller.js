import { Video } from "../models/Video.model.js";
import { User } from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteImage, uploadImage, uploadToMinIO } from "../utils/minio.js";

import { publishToQueue } from "../utils/rabbitmq.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { RABBITMQ, VIDEO_STATUS } from "../constants.js";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import path from "path";

// Dummy image functions
// const uploadImage = async (buffer) => {
//     return `dummy-thumbnail-url-${Date.now()}.jpg`;
// };

// const deleteImage = async (imageUrl) => {
//     console.log(`Deleted image: ${imageUrl}`);
// };

const uploadVideo = asyncHandler(async(req , res )=>{
    const videoFile = req.files?.video?.[0] || req.file;
    const thumbnailFile = req.files?.thumbnail?.[0];
    const { title, description } = req.body || {};

    if (!videoFile) {
        throw new ApiError(400,"No video file uploaded")
    }

    if (!videoFile.mimetype?.startsWith("video/")) {
      throw new ApiError(400, "Invalid video file. Please upload a video in the 'video' field.");
    }

    if (thumbnailFile && !thumbnailFile.mimetype?.startsWith("image/")) {
      throw new ApiError(400, "Invalid thumbnail file. Please upload an image in the 'thumbnail' field.");
    }

    // let thumbnailUrl = "";
    // if (thumbnailFile) {
    //     const uploadImageRes = await uploadImage(thumbnailFile.buffer, thumbnailFile.originalname,);
    //     thumbnailUrl = uploadImageRes.path;
    // }

    const objectName = `${Date.now()}-${videoFile.originalname}`;
    await uploadToMinIO(videoFile.buffer, objectName);


    const video = await Video.create({
      title: title || videoFile.originalname,
      description: description || "",
      status: VIDEO_STATUS.PROCESSING,
      thumbnailUrl: null,
      owner: req.user?._id
    });
   if(thumbnailFile){
    const extenstion = path.extname(thumbnailFile.originalname).toLowerCase();
    const thumnailPath = `${video._id}${extenstion}`;
    const uploadImageRes = await uploadImage(thumbnailFile.buffer, thumnailPath);
    video.thumbnailUrl =  uploadImageRes.path;
    await video.save();
   }

    await publishToQueue(RABBITMQ.QUEUES.VIDEO_PROCESSING,{
      videoId: video._id.toString(),
      objectName,
      hasCustomThumbnail: !!thumbnailFile,
    });

    console.log(`thumbnailUrl: ${video.thumbnailUrl}`);

    return res.status(200).json({
      message: VIDEO_STATUS.PROCESSING,
      videoId: video._id.toString(),
      thumbnailUrl: video.thumbnailUrl || null
    });
});


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
  const videos = await Video.find({status: { $in: [VIDEO_STATUS.READY, VIDEO_STATUS.LIVE] }}).sort({uploadDate:-1});
  if(!videos){
    throw new ApiError(400,"some error occured or no video is ready")
  }
  return res.json(videos);

})


const getVideoById = asyncHandler(async(req , res)=>{
  const videoId = req.params.id;
  const video = await Video.findById(videoId)
  if(!video){
    throw new ApiError(404,"Video not found")
  }
  return res.status(200).json(
    new ApiResponse(200,video,"Video fetched successfully")
  )

})

const updateVideoDetails = asyncHandler(async(req,res)=>{
  const videoId = req.params.id;
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404,"Video not found")
  }
  if(video.owner?.toString() !== req.user?._id?.toString()){
    throw new ApiError(403,"You are not authorized to update this video")
  }
  
  const {title,description} = req.body;
  if(title){
    video.title = title;
  }
  if(description){
    video.description = description;
  }
  
  const file = req.file;
  if(file){
      if (video.thumbnailUrl) {
          await deleteImage(video.thumbnailUrl);
      }
      const newThumbnailUrl = await uploadImage(file.buffer);
      video.thumbnailUrl = newThumbnailUrl;
  }
  
  const updatedVideo = await video.save();
  return res.status(200).json(
    new ApiResponse(200,updatedVideo,"Video details updated successfully")
  )
})

const deleteVideo = asyncHandler(async (req,res)=>{
  const videoId = req.params.id;
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404,"Video not found")
  }
  if(video.owner?.toString() !== req.user?._id?.toString()){
    throw new ApiError(403,"You are not authorized to delete this video")
  }
  await Video.findByIdAndDelete(videoId)
  return res.status(200).json(
    new ApiResponse(200,{},"Video deleted successfully")
  )
})





const incrementVideoViews = asyncHandler(async (req, res) => {
  const videoId = req.params.id;
  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { views: video.views }, "Video view count updated successfully")
  );
});

const getLiveViewers = asyncHandler(async (req, res) => {
    const { streamKey } = req.params;

    if (!streamKey) {
        throw new ApiError(400, "Stream key is required");
    }

    try {
        const response = await axios.get("http://nginx-origin:80/stats");
        const parser = new XMLParser();
        const xmlData = parser.parse(response.data);
        
        let viewers = 0;
        
        const server = xmlData?.rtmp?.server;
        
        if (server && server.application) {
            const applications = Array.isArray(server.application) ? server.application : [server.application];
            
            for (const app of applications) {
                if (app.name === "live" && app.live && app.live.stream) {
                    const streams = Array.isArray(app.live.stream) ? app.live.stream : [app.live.stream];
                    const stream = streams.find((s) => s.name === streamKey);
                    
                    if (stream && stream.nsubscribers !== undefined) {
                        viewers = parseInt(stream.nsubscribers, 10);
                        if (isNaN(viewers)) viewers = parseInt(stream.nclients || "0", 10);
                        break;
                    } else if (stream && stream.nclients !== undefined) {
                        viewers = parseInt(stream.nclients, 10);
                        break;
                    }
                }
            }
        }
        
        return res.status(200).json({ viewers });
    } catch (error) {
        console.error("Error fetching live stats:", error.message);
        return res.status(200).json({ viewers: 0 });
    }
});

export { uploadVideo,
  streamAuth,
  getAllReadyVideo,
  getVideoStatus,
  incrementVideoViews,
  getLiveViewers,
  updateVideoDetails,
  getVideoById,
  deleteVideo };