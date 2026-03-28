import { downloadRawVideo, uploadHLSFolder, uploadImage } from "../utils/minio.js";
import path from "path";
import { exec, spawn } from "child_process";
import { chunkVideoWithWatermark, clearTempFolder } from "./chunkVideo.js";
import { sendWebhook } from "../utils/sendWebhook.js";
import { BUCKETS, MINIO, VIDEO_PROCESSING } from "../constants.js";


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
  try {
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
  } catch (error) {
    // If thumbnail extraction fails (e.g., video too short), try from the start
    console.warn(`Thumbnail extraction at ${VIDEO_PROCESSING.THUMBNAIL_CAPTURE_AT} failed. Retrying from start.`);
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", inputPath,
        "-ss", "00:00:00",
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
          reject(new Error(`Thumbnail extraction from start failed with code ${code}`));
        }
      });
    });
  }
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
    console.log(`Received data:`, JSON.stringify(data));
    const { videoId, objectName, flvPath, isLiveRecording } = data;
    const hasCustomThumbnail = data.hasCustomThumbnail ?? data.thumbnail ?? false;
    
    if (!videoId) {
      throw new Error(`Missing required field: videoId`);
    }
    
    let localPath;
    if (isLiveRecording && flvPath) {
      // Live recording - file already exists locally
      localPath = flvPath;
      console.log(`Starting processing for live recording - videoId: ${videoId}, flvPath: ${flvPath}`);
    } else if (objectName) {
      // Regular upload - need to download from MinIO
      localPath = path.join("temp", objectName);
      console.log(`Starting processing for upload - videoId: ${videoId}, objectName: ${objectName}`);
      await downloadRawVideoAndSave(objectName, localPath);
      console.log(` Downloaded: ${localPath}`);
    } else {
      throw new Error(`Missing required fields: either objectName or flvPath must be provided`);
    }

     const outputDir = path.join("temp", VIDEO_PROCESSING.OUTPUT_DIR_NAME);
     const thumbnailPath = path.join(outputDir, VIDEO_PROCESSING.THUMBNAIL_FILE_NAME);

    let thumbnailUrl;

    
    await chunkVideoWithWatermark(localPath, outputDir, videoId);


    const duration = await extractDurationMMSS(localPath);
    if (!hasCustomThumbnail) {
      await generateThumbnail(localPath, thumbnailPath);
      const thumbnailObjectName = `${videoId}.jpg`;
      await uploadImage(thumbnailPath, thumbnailObjectName);
      thumbnailUrl = `${BUCKETS.THUMBNAILS}/${thumbnailObjectName}`;
    }

    
    await uploadHLSFolder(
      outputDir,
      BUCKETS.PROCESSED_VIDEOS,
      videoId
    );

    
    
    const processedItemName = objectName || flvPath;
    console.log(` Finished processing ${processedItemName}`);

    await sendWebhook(videoId, duration, thumbnailUrl);
    
    await clearTempFolder();


    ack(); 
  } catch (error) {
    console.error(" Error processing:", error);
    nack(); 
  }
};
export { processVideo };