import express from "express";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { APP } from "./constants.js";

dotenv.config();

await connectDB();
const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "*";
const allowedOrigins = corsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: corsOrigin === "*" ? true : allowedOrigins,
    credentials: corsOrigin !== "*"
}));

app.use(express.json({ limit: APP.JSON_LIMIT }))
app.use(express.urlencoded({ extended: true, limit: APP.URLENCODED_LIMIT }))
app.use(express.static(APP.STATIC_DIR))
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

const port = process.env.PORT || APP.PORT;


app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})
