import { processVideo } from "./services/videoProcessor.js";
import path from "path";
import { chunkVideoWithWatermark } from "./services/chunkVideo.js";
import {consumeQueue} from "./utils/rabbitmq.js";

// video_tasks
consumeQueue("video-processing", processVideo);
