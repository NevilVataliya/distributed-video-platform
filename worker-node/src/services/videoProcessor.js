import { downloadRawVideo, uploadHLSFolder, uploadImage } from "../utils/minio.js";
import path from "path";
import { exec, spawn } from "child_process";
import { chunkVideoWithWatermark, clearTempFolder } from "./chunkVideo.js";
import { sendWebhook } from "../utils/sendWebhook.js";
import { BUCKETS, VIDEO_PROCESSING } from "../constants.js";


const downloadRawVideoAndSave = async (name, localPath) => {
    try {
        await downloadRawVideo(name, localPath);
        console.log(`Video ${name} downloaded successfully to ${localPath}`);
    } catch (error) {
        console.error(`Error downloading video ${name}:`, error);
        throw error;
    }
}

const generateThumbnail = async (inputPath, thumbnailPath) => {
  await new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", inputPath,
      "-ss", VIDEO_PROCESSING.THUMBNAIL_CAPTURE_AT,
      "-vframes", "1",
      thumbnailPath,
      "-y"
    ]);

    ffmpeg.on("error", (error) => {
      reject(new Error(`Failed to start thumbnail extraction: ${error.message}`));
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Thumbnail extraction failed with code ${code}`));
      }
    });
  });
};

const formatDurationToMMSS = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const extractDurationMMSS = async (inputPath) => {
  const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"${inputPath}\"`;

  const output = await new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Duration extraction failed: ${stderr || error.message}`));
        return;
      }
      resolve(stdout.trim());
    });
  });

  const seconds = parseFloat(output);
  console.log(`Extracted duration in seconds: ${seconds}`);
  return formatDurationToMMSS(seconds);
};

const processVideo = async (data, ack, nack) => {
  try {
    const { videoId, objectName } = data;
    console.log(`Starting processing for videoId: ${videoId}, objectName: ${objectName}`);
    const localPath = path.join("temp", objectName);
  const outputDir = path.join("temp", VIDEO_PROCESSING.OUTPUT_DIR_NAME);
  const thumbnailPath = path.join(outputDir, VIDEO_PROCESSING.THUMBNAIL_FILE_NAME);

    
    await downloadRawVideoAndSave(objectName, localPath);
    console.log(` Downloaded: ${localPath}`);

    
    await chunkVideoWithWatermark(localPath, outputDir, videoId);

    await generateThumbnail(localPath, thumbnailPath);
    const duration = await extractDurationMMSS(localPath);

    const thumbnailObjectName = `${videoId}/${VIDEO_PROCESSING.THUMBNAIL_FILE_NAME}`;
    await uploadImage(thumbnailPath, thumbnailObjectName, BUCKETS.THUMBNAILS);

    
    await uploadHLSFolder(
      outputDir,
      BUCKETS.PROCESSED_VIDEOS,
      videoId
    );

    const thumbnailUrl = `${BUCKETS.THUMBNAILS}/${thumbnailObjectName}`;
    
    console.log(` Finished processing ${objectName}`);

    await sendWebhook(videoId, thumbnailUrl, duration);
    
    await clearTempFolder();


    ack(); 
  } catch (error) {
    console.error(" Error processing:", error);
    nack(); 
  }
};
export { processVideo };