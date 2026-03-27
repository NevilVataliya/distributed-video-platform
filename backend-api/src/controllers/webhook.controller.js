import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/Video.model.js";
import { User } from "../models/User.model.js";

const webhookUpdate = asyncHandler(async(req,res)=>{
  const {videoId, status, hlsUrl, thumbnailUrl,duration} = req.body;
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404,"Video not found");
  }
  
  if(status !== undefined) video.status = status;
  if(hlsUrl !== undefined) video.hlsUrl = hlsUrl;
  if(video.thumbnailUrl==""){
    if(thumbnailUrl !== undefined) video.thumbnailUrl = thumbnailUrl;
  }
  if(duration !== undefined) video.duration = duration;
  
  const updatedV = await video.save();

  if(!updatedV){
    throw new ApiError(500, "Unable to update status and hls");
  }
  
  // console.log(`Updated video ${videoId} with status: ${status}, hlsUrl: ${hlsUrl}, thumbnailUrl: ${thumbnailUrl}, duration: ${duration}`);

  return res.status(200).json(
    new ApiResponse(200, updatedV, "Successfully updated the status and hls")
  );
})


//Can ignore this for now
const webhookStreamStart = asyncHandler(async(req,res)=>{
    const {name} = req.body; // Stream key
    
    if (!name) {
        return res.sendStatus(400);
    }
    
    const user = await User.findOne({streamKey:name});
    if(!user){
        return res.sendStatus(401);
    }

    // Automatically create a new live stream video
    await Video.create({
        title: `${user.username}'s Live Stream`,
        description: `Live broadcast by ${user.username}`,
        status: "Live",
        owner: user._id
    });

    return res.sendStatus(200);
})

export {webhookUpdate, webhookStreamStart}
