export const QUEUES = {
	VIDEO_PROCESSING: "video-processing",
};

export const RABBITMQ = {
	URL: "amqp://rabbitmq:5672",
	PREFETCH_COUNT: 1,
};

export const BUCKETS = {
	RAW_VIDEOS: "raw-videos",
	PROCESSED_VIDEOS: "processed-videos",
	THUMBNAILS: "thumbnails",
};

export const MINIO = {
	ENDPOINT: "minio",
	PORT: 9000,
	USE_SSL: false,
	REGION: "us-east-1",
	PUBLIC_BASE_URL: "http://localhost:9000",
};

export const WEBHOOK = {
	BASE_URL: "http://host.docker.internal:3000",
	PROCESSING_DONE_PATH: "/api/webhooks/processing-done",
	STATUS_READY: "Ready",
	STATUS_FAILED: "Failed",
};

export const VIDEO_PROCESSING = {
	CHUNK_SECONDS: 6,
	WATERMARK_TEXT: "Sample Watermark",
	OUTPUT_DIR_NAME: "output",
	THUMBNAIL_FILE_NAME: "thumbnail.jpg",
	THUMBNAIL_CAPTURE_AT: "00:00:02",
	PLAYLIST_FILE_NAME: "playlist.m3u8",
};
