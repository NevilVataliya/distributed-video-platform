import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import axios from "axios";

const CHUNK_SECONDS = 6;
const WATERMARK_TEXT = "Sample Watermark";
const fsPromises = fs.promises;

const clearTempFolder = async () => {
    try {
        const files = await fsPromises.readdir("temp");

        await Promise.all(
            files.map(file =>
                fsPromises.rm(path.join("temp", file), { recursive: true, force: true })
            )
        );
        console.log("Temp folder cleaned");
    } catch (err) {
        console.error(" Failed to clean temp:", err.message);
    }
};

function checkFFmpeg() {
    return new Promise((resolve, reject) => {
        const p = spawn("ffmpeg", ["-version"]);
        p.on("close", () => { console.log("FFmpeg found."); resolve(); });
        p.on("error", () => { console.error("FFmpeg not found. Run: sudo apt install ffmpeg"); reject(new Error("FFmpeg not installed")); });
    });
}

const checkInputVideo = (inputPath) => {
    if (!fs.existsSync(inputPath)) {
        throw new Error(`Input video not found at path: ${inputPath}`);
    }
};

const prepareOutputDirectory = (outputDir) => {
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
        console.log(`Existing output directory ${outputDir} removed.`);
    }
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Output directory ${outputDir} created.`);
}

const chunkVideo = (inputPath, outputDir, videoId) => {
    return new Promise((resolve, reject) => {
        const m3u8Path = path.join(outputDir, "playlist.m3u8");

        const segmentPath = path.join(outputDir, "%03d.ts");
        const safeText = WATERMARK_TEXT.replace(/'/g, "\\'").replace(/:/g, "\\:");

        const ffmpegArgs = [
            "-i", inputPath,
            "-vf", `drawtext=text='${safeText}':fontsize=28:fontcolor=white@0.8:box=1:boxcolor=black@0.4:x=20:y=20`,// add the watermark
            "-codec:v", "libx264",// compress video
            "-codec:a", "aac",//compress audio
            "-crf", "23",
            "-preset", "fast", // quality  ---> compression fast then quality low
            "-g", "180",           // this is means 180 frames per keyframe, if your video is 30fps then it will be 6 seconds per keyframe, this is important for HLS chunking
            // -g means group of frames ---> 180
            //but in the actualy 24 fps ---> it do chunk of 180/24 = 7.5 seconds, but we will set the chunk time to 6 seconds so it will create chunk of 6 seconds and the last chunk will be 1.5 seconds
            "-keyint_min", "180",
            "-sc_threshold", "0",
            "-hls_time", String(CHUNK_SECONDS), //time of each chunk
            "-hls_playlist_type", "vod",  // type: video on demand
            "-hls_segment_filename", segmentPath, // this tell the chunk nameing 
            "-y", // if all file exist then overwrite
            m3u8Path,
        ];
        const startTime = Date.now();
        const ffmpeg = spawn("ffmpeg", ffmpegArgs);

        ffmpeg.stderr.on("data", (data) => {
            const line = data.toString();

            console.log(line);

            if (line.includes("time=")) {
                const match = line.match(/time=(\S+)/);
                if (match) process.stdout.write(`\r    Encoding at ${match[1]}...  `);
            }
        });
        ffmpeg.stderr.on("error", () => { });
        ffmpeg.stdout.on("error", () => { });

        ffmpeg.on("close", async (code) => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            if (code === 0) {
                console.log(`\n\n FFmpeg done in ${elapsed}s`);
                resolve();
            } else {
                // reject(new Error(`FFmpeg exited with code ${code}`));
                await axios.post("http://localhost:3000/api/videos/webhook", {
                    videoId,
                    status: "Failed",
                    hlsUrl: null
                });
            }
        });
        ffmpeg.on("error", (err) => {
            reject(new Error(`Failed to start FFmpeg: ${err.message}`));
        });
    });
}


const chunkVideoWithWatermark = async (inputPath, outputDir, videoId) => {
    try {
        checkInputVideo(inputPath);
        prepareOutputDirectory(outputDir);
        await checkFFmpeg();
        await chunkVideo(inputPath, outputDir, videoId);
        console.log(`Video chunked and uploaded successfully.`);
    } catch (error) {
        console.error("Error in chunking video:", error);
        throw error;
    }
};



export { chunkVideoWithWatermark, clearTempFolder };