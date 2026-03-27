import axios from "axios";

export const sendWebhook = async (videoId, thumbnailUrl, duration) => {
    const hlsUrl = `http://localhost:9000/processed-videos/${videoId}/playlist.m3u8`;
    try {
        const response =
            await axios.post("http://host.docker.internal:3000/api/webhooks/processing-done", {
                videoId,
                status: "Ready",
                hlsUrl,
                thumbnailUrl,
                duration
            });
        console.log("Webhook sent successfully:", response.data);
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
};