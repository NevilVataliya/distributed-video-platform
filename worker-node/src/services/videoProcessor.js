import { downloadRawVideo ,uploadHLSFolder} from "../utils/minio.js";
import path from "path";
import { chunkVideoWithWatermark } from "./chunkVideo.js";


const downloadRawVideoAndSave = async (name, localPath) => {
    try {
        await downloadRawVideo(name, localPath);
        console.log(`Video ${name} downloaded successfully to ${localPath}`);
    } catch (error) {
        console.error(`Error downloading video ${name}:`, error);
        throw error;
    }
}

const processVideo = async (data, ack, nack) => {
  try {
    const { videoId, objectName } = data;
    console.log(`Starting processing for videoId: ${videoId}, objectName: ${objectName}`);
    const localPath = path.join("temp", objectName);

    
    await downloadRawVideoAndSave(objectName, localPath);
    console.log(`✅ Downloaded: ${localPath}`);

    
    await chunkVideoWithWatermark(localPath, path.join("temp", "output"));

    
    await uploadHLSFolder(
      path.join("temp", "output"),
      "processed-videos",
      objectName
    );

    console.log(` Finished processing ${objectName}`);

    ack(); 
  } catch (error) {
    console.error(" Error processing:", error);
    nack(); //fail
  }
};
export { processVideo };