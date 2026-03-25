import { processVideo } from "./services/videoProcessor.js";
import {consumeQueue} from "./utils/rabbitmq.js";

// video_tasks
consumeQueue("video-processing", processVideo);
