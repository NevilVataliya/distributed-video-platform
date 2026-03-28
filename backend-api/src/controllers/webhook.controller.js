import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/Video.model.js";
import { User } from "../models/User.model.js";
import { VIDEO_STATUS } from "../constants.js";
import { publishToQueue } from "../utils/rabbitmq.js";

const webhookUpdate = asyncHandler(async(req,res)=>{
  const {videoId, status, hlsUrl, thumbnailUrl,duration} = req.body;
  const video = await Video.findById(videoId);
  if(!video){
    throw new ApiError(404,"Video not found");
  }
  
  if(status !== undefined) video.status = status;
  if(hlsUrl !== undefined) video.hlsUrl = hlsUrl;
  if (thumbnailUrl !== undefined && thumbnailUrl !== null && thumbnailUrl !== "") {
    video.thumbnailUrl = thumbnailUrl;
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


// not sure about this controller ; Need to discuss with others
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
        status: VIDEO_STATUS.LIVE,
        hlsUrl: 'live/' + name + '.m3u8', // Assuming Nginx is configured to save live streams in this format
        owner: user._id
    });

    return res.sendStatus(200);
})


// not sure about this controller ; Need to discuss with others

const webhookStreamEnd = asyncHandler(async(req, res) => {
    const { name, path } = req.body; // Nginx sends stream key as 'name' and file path as 'path'
    
    if (!name || !path) {
        return res.sendStatus(400);
    }
    
    const user = await User.findOne({ streamKey: name });
    if (!user) {
        return res.sendStatus(401);
    }

    // Find the latest "Live" video for this user
    const video = await Video.findOne({
        owner: user._id,
        status: VIDEO_STATUS.LIVE
    }).sort({ _id: -1 });

    if (video) {
        video.status = VIDEO_STATUS.PROCESSING;
        await video.save();

        // Push to RabbitMQ for Vasu's worker
        await publishToQueue("video-processing", {
            videoId: video._id.toString(),
            flvPath: path,
            isLiveRecording: true
        });
    }

    return res.sendStatus(200);
});

export {webhookUpdate, webhookStreamStart, webhookStreamEnd}
