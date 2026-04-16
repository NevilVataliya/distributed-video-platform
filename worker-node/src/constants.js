import "dotenv/config";

export const QUEUES = {
	VIDEO_PROCESSING: "video-processing",
};

export const RABBITMQ = {
	URL: process.env.RABBITMQ_URL || "amqp://rabbitmq:5672",
	PREFETCH_COUNT: Number(process.env.PREFETCH_COUNT || 1),
};

export const BUCKETS = {
	RAW_VIDEOS: "raw-videos",
	PROCESSED_VIDEOS: "processed-videos",
	THUMBNAILS: "thumbnails",
};

export const MINIO = {
	ENDPOINT: process.env.MINIO_ENDPOINT || "minio",
	PORT: Number(process.env.MINIO_PORT || 9000),
	USE_SSL: String(process.env.MINIO_USE_SSL || "false").toLowerCase() === "true",
	REGION: process.env.MINIO_REGION || "us-east-1",
	ACCESS_KEY: process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "admin",
	SECRET_KEY: process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "password123",
	PUBLIC_BASE_URL: process.env.MINIO_PUBLIC_BASE_URL || "http://localhost:9000",
};

export const WEBHOOK = {
	BASE_URL: process.env.WEBHOOK_BASE_URL || "http://host.docker.internal:3000",
	PROCESSING_DONE_PATH: "/api/webhooks/processing-done",
	STATUS_READY: "Ready",
	STATUS_FAILED: "Failed",
};

export const VIDEO_PROCESSING = {
	CHUNK_SECONDS: 6,
	WATERMARK_TEXT: "HexaNodes",
	OUTPUT_DIR_NAME: "output",
	THUMBNAIL_FILE_NAME: "thumbnail.jpg",
	THUMBNAIL_CAPTURE_AT: "00:00:02",
	PLAYLIST_FILE_NAME: "playlist.m3u8",
};
