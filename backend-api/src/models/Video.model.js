import mongoose from "mongoose";
import { VIDEO_STATUS } from "../constants.js";

const videoSchema = mongoose.Schema(
    {
        title:{
            type:String,
            required:true
        },
        description:{
            type:String
        },
        uploadDate:{
            type:Date,
            default:Date.now
        },
        status:{
            type:String,
            enum:[VIDEO_STATUS.PROCESSING, VIDEO_STATUS.READY, VIDEO_STATUS.LIVE, VIDEO_STATUS.FAILED],
            default:VIDEO_STATUS.PROCESSING
        },
        hlsUrl:{
            type:String,
            default:""
        },
        duration:{
            type:String,
        },
        owner:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        thumbnailUrl:{
            type:String,
            default:""
        },
        views:{
            type:Number,
            default:0
        }
        // metadata something after discussion add krna hai
    },
    {timestamps:true}
)

export const Video = mongoose.model("Video",videoSchema);