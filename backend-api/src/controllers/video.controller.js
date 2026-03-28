import { Video } from "../models/Video.model.js";
import { User } from "../models/User.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteImage, uploadImage, uploadToMinIO } from "../utils/minio.js";

import { publishToQueue } from "../utils/rabbitmq.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { RABBITMQ, VIDEO_STATUS } from "../constants.js";

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

    let thumbnailUrl = "";
    if (thumbnailFile) {
        const uploadImageRes = await uploadImage(thumbnailFile.buffer, thumbnailFile.originalname);
        thumbnailUrl = uploadImageRes.path;
    }

    const objectName = `${Date.now()}-${videoFile.originalname}`;
    await uploadToMinIO(videoFile.buffer, objectName);


    const video = await Video.create({
      title: title || videoFile.originalname,
      description: description || "",
      status: VIDEO_STATUS.PROCESSING,
      thumbnailUrl: thumbnailUrl,
      owner: req.user?._id
    });

    await publishToQueue(RABBITMQ.QUEUES.VIDEO_PROCESSING,{
      videoId: video._id.toString(),
      objectName,
      thumbnail: !!thumbnailUrl,
    });

    return res.status(200).json({
      message: VIDEO_STATUS.PROCESSING,
      videoId: video._id.toString(),
      thumbnailUrl: thumbnailUrl
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

export { uploadVideo,
  streamAuth,
  getAllReadyVideo,
  getVideoStatus,
  incrementVideoViews,
  updateVideoDetails,
  getVideoById,
  deleteVideo };