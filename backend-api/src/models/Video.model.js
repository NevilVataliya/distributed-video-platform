import mongoose from "mongoose";

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
            enum:["Processing","Ready","Live","Failed"],
            default:"Processing"
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