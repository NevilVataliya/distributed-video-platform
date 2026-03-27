export const APP = {
	PORT: 3000,
	JSON_LIMIT: "16kb",
	URLENCODED_LIMIT: "16kb",
	STATIC_DIR: "public",
	ROOT_MESSAGE: "server is ready",
};

export const DB = {
	NAME: "VideoDS",
};

export const RABBITMQ = {
	URL: "amqp://localhost",
	QUEUES: {
		VIDEO_PROCESSING: "video-processing",
	},
};

export const MINIO = {
	ENDPOINT: "localhost",
	PORT: 9000,
	USE_SSL: false,
	REGION: "us-east-1",
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
