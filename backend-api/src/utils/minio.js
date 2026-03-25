import { Client } from "minio";
import 'dotenv/config'

const MINIO_ENDPOINT = "localhost";
const MINIO_PORT = 9000;
const MINIO_USE_SSL = false;
const MINIO_ACCESS_KEY =
	process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "admin";
const MINIO_SECRET_KEY =
	process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "password123";

const RAW_VIDEOS_BUCKET = "raw-videos";
console.log(MINIO_ACCESS_KEY)

const minioClient = new Client({
	endPoint: MINIO_ENDPOINT,
	port: MINIO_PORT,
	useSSL: MINIO_USE_SSL,
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY,
});

console.log("MinIO client initialized with endpoint:", MINIO_ENDPOINT, "port:", MINIO_PORT);


const ensureRawVideosBucket = async () => {
	const exists = await minioClient.bucketExists(RAW_VIDEOS_BUCKET);
	if (!exists) {
		await minioClient.makeBucket(RAW_VIDEOS_BUCKET, "us-east-1");
	}
};  

export const uploadToMinIO = async (buffer, name) => {
	if (!buffer || !name) {
		throw new Error("uploadToMinIO requires both buffer and name.");
	}

	await ensureRawVideosBucket();

	await minioClient.putObject(RAW_VIDEOS_BUCKET, name, buffer, buffer.length, {
		"Content-Type": "video/mp4",
	});

	return {
		bucket: RAW_VIDEOS_BUCKET,
		objectName: name,
	};
};

export { minioClient, RAW_VIDEOS_BUCKET };
