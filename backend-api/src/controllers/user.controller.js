import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/User.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import { Video } from "../models/Video.model.js";
import { VIDEO_STATUS } from "../constants.js";



const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken=refreshToken
        console.log(refreshToken, "   ", accessToken)
        await user.save({validateBeforeSave: false}) 
        return {accessToken,refreshToken}
    }catch(error){
        throw new ApiError(500,`something went wrong while generating token ${error}`)
    }
}

const registerUser = asyncHandler(async(req,res)=>{

    const { fullName,email,username,password } = req.body

    console.log(req.body)
    if(
        [fullName,email,username,password].some((field)=>
        !field || field.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already exists")
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        streamKey: crypto.randomBytes(8).toString("hex")
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering")
    }
    
    return res.status(201).json(
        new ApiResponse(200,createdUser, "user registered successfully")
    )
})


const loginUser = asyncHandler(async(req,res)=>{
    
    console.log(req.body)
    const {email,username,password} = req.body
    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }
    if(!password){
        throw new ApiError(400,"password is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User not exist")
    }

    const isPasswordValid  = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedUser = await User.findById(user._id).
    select("-password -refreshToken")

    // const options = {
    //     httpOnly:true,
    //     secure:true
    // }
    
    return res.status(200)
    .cookie("accessToken",accessToken)
    .cookie("refreshToken",refreshToken)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true  // after update new value response me aayegi
        }
    )

    // const options = {
    //     httpOnly:true,
    //     secure:true
    // }

    return res.status(200).clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new ApiResponse(200,{},"User logged out"))

})

const checkUsernameAvailability = asyncHandler(async (req, res) => {
  const { username } = req.query;

  if (!username) {
    throw new ApiError(400, "Username is required");
  }

  const existingUser = await User.findOne({
    username: username.toLowerCase(),
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { available: !existingUser },
      existingUser ? "Username already taken" : "Username available"
    )
  );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, "User fetched")
  );
});


const getUserVideos = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const videos = await Video.find({
        owner: user._id,
        status: { $in: [VIDEO_STATUS.READY, VIDEO_STATUS.LIVE] }
    }).populate("owner", "username fullName").sort({ uploadDate: -1 });

    return res.status(200).json(
        new ApiResponse(200, videos, "User videos fetched successfully")
    );
});

const regenerateStreamKey = asyncHandler(async (req, res) => {
    const newStreamKey = crypto.randomBytes(8).toString("hex");
    
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { streamKey: newStreamKey }
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, { streamKey: user.streamKey }, "Stream key regenerated successfully")
    );
});

export {registerUser,
    loginUser,logoutUser,checkUsernameAvailability,getCurrentUser,getUserVideos,regenerateStreamKey
}