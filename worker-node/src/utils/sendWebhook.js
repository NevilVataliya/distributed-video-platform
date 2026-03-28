import axios from "axios";
import { BUCKETS, MINIO, WEBHOOK, VIDEO_PROCESSING } from "../constants.js";

export const sendWebhook = async (videoId, duration, thumbnailUrl) => {
    const hlsUrl = `${BUCKETS.PROCESSED_VIDEOS}/${videoId}/${VIDEO_PROCESSING.PLAYLIST_FILE_NAME}`;
    const payload = {
        videoId,
        status: WEBHOOK.STATUS_READY,
        hlsUrl,
        duration,
    };

    if (thumbnailUrl) {
        payload.thumbnailUrl = thumbnailUrl;
    }

    try {
        const response = await axios.post(`${WEBHOOK.BASE_URL}${WEBHOOK.PROCESSING_DONE_PATH}`, payload);
        console.log("Webhook sent successfully:", response.data);
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
};