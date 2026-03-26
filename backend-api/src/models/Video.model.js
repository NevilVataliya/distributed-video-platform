import mongoose from "mongoose";

const videoSchema = mongoose.Schema(
    {
        title:{
            type:String,
            required:true
        },
        uploadDate:{
            type:Date,
            default:Date.now
        },
        status:{
            type:String,
            enum:["Processing","Ready"],
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
        thumbnail:{
            type:String,
            default:""
        }
        // metadata something after discussion add krna hai
    },
    {timestamps:true}
)

export const Video = mongoose.model("Video",videoSchema);