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
        hslUrl:{
            type:String,
            default:""
        },
        streamKey:{
            type:String,
            unique:true
        }
        // user(owner) duration or thumbnail or metadata something after discussion add krna hai
    },
    {timestamps:true}
)

export const Video = mongoose.model("Video",videoSchema);