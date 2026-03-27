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
import userRouter from "./routes/user.route.js"
import webhookRouter from "./routes/webhook.route.js"

app.use("/api/videos",videoRouter)
app.use("/api/users/",userRouter)
app.use("/api/webhooks",webhookRouter)

app.get("/",(req,res)=>{
    res.send("server is ready")
})

const port = process.env.PORT || 3000;


app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})
