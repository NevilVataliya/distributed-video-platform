import "dotenv/config";

export const APP = {
	PORT: 3000,
	JSON_LIMIT: "16kb",
	URLENCODED_LIMIT: "16kb",
	STATIC_DIR: "public",
	ROOT_MESSAGE: "server is ready",
};

export const DB = {
	NAME: process.env.DB_NAME || "VideoDS",
};

export const RABBITMQ = {
	URL: process.env.RABBITMQ_URL || "amqp://localhost",
	QUEUES: {
		VIDEO_PROCESSING: "video-processing",
	},
};

export const MINIO = {
	ENDPOINT: process.env.MINIO_ENDPOINT || "localhost",
	PORT: Number(process.env.MINIO_PORT || 9000),
	USE_SSL: String(process.env.MINIO_USE_SSL || "false").toLowerCase() === "true",
	REGION: process.env.MINIO_REGION || "us-east-1",
	BUCKETS: {
		RAW_VIDEOS: "raw-videos",
		THUMBNAILS: "thumbnails",
	},
};

export const VIDEO_STATUS = {
	PROCESSING: "Processing",
	READY: "Ready",
	LIVE: "Live",
	FAILED: "Failed",
};
