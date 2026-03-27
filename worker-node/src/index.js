import { processVideo } from "./services/videoProcessor.js";
import {consumeQueue} from "./utils/rabbitmq.js";
import { QUEUES } from "./constants.js";

// video_tasks
consumeQueue(QUEUES.VIDEO_PROCESSING, processVideo);
