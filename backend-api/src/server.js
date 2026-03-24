import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

await connectDB();
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())



import videoRouter from "./routes/video.route.js"


app.use("/api/videos",videoRouter)

// import {Video} from "./models/Video.model.js";
// await Video.create({ title: "test video" });

app.get("/",(req,res)=>{
    res.send("server is ready")
})

const port = process.env.PORT || 3000;


app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})