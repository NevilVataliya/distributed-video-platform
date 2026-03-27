import axios from "axios";
import { BUCKETS, MINIO, WEBHOOK, VIDEO_PROCESSING } from "../constants.js";

export const sendWebhook = async (videoId, thumbnailUrl, duration) => {
    const hlsUrl = `${MINIO.PUBLIC_BASE_URL}/${BUCKETS.PROCESSED_VIDEOS}/${videoId}/${VIDEO_PROCESSING.PLAYLIST_FILE_NAME}`;
    try {
        const response =
            await axios.post(`${WEBHOOK.BASE_URL}${WEBHOOK.PROCESSING_DONE_PATH}`, {
                videoId,
                status: WEBHOOK.STATUS_READY,
                hlsUrl,
                thumbnailUrl,
                duration
            });
        console.log("Webhook sent successfully:", response.data);
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
};