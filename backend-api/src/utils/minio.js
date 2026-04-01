import { Client } from "minio";
import 'dotenv/config'
import path from "path";
import { MINIO } from "../constants.js";

const MINIO_ENDPOINT = MINIO.ENDPOINT;
const MINIO_PORT = parseInt(String(MINIO.PORT), 10);
const MINIO_USE_SSL = MINIO.USE_SSL;
const MINIO_ACCESS_KEY =
	process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "minioadmin";
const MINIO_SECRET_KEY =
	process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "minioadmin";

const RAW_VIDEOS_BUCKET = MINIO.BUCKETS.RAW_VIDEOS;
const THUMBNAILS_BUCKET = MINIO.BUCKETS.THUMBNAILS;

const minioClient = new Client({
	endPoint: MINIO_ENDPOINT,
	port: MINIO_PORT,
	useSSL: MINIO_USE_SSL,
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY,
});

console.log("MinIO client initialized with endpoint:", MINIO_ENDPOINT, "port:", MINIO_PORT);

const getImageContentType = (value) => {
	if (typeof value !== "string") {
		return "application/octet-stream";
	}

	const extension = path.extname(value).toLowerCase();
	if (extension === ".png") {
		return "image/png";
	}
	if (extension === ".jpg" || extension === ".jpeg") {
		return "image/jpeg";
	}
	if (extension === ".webp") {
		return "image/webp";
	}
	if (extension === ".gif") {
		return "image/gif";
	}

	return "application/octet-stream";
};

const setPublicReadPolicy = async (bucketName) => {
	const publicReadPolicy = {
		Version: "2012-10-17",
		Statement: [
			{
				Effect: "Allow",
				Principal: { AWS: ["*"] },
				Action: ["s3:GetObject"],
				Resource: [`arn:aws:s3:::${bucketName}/*`],
			},
		],
	};

	await minioClient.setBucketPolicy(bucketName, JSON.stringify(publicReadPolicy));
};

const ensureBucketExists = async (bucketName) => {
	const exists = await minioClient.bucketExists(bucketName);
	if (!exists) {
		await minioClient.makeBucket(bucketName, MINIO.REGION);
	}

	if (bucketName === THUMBNAILS_BUCKET) {
		await setPublicReadPolicy(bucketName);
	}
};

export const uploadToMinIO = async (buffer, name) => {
	if (!buffer || !name) {
		throw new Error("uploadToMinIO requires both buffer and name.");
	}

	await ensureBucketExists(RAW_VIDEOS_BUCKET);

	await minioClient.putObject(RAW_VIDEOS_BUCKET, name, buffer, buffer.length, {
		"Content-Type": "video/mp4",
	});

	return {
		bucket: RAW_VIDEOS_BUCKET,
		objectName: name,
	};
};

export const uploadImage = async (bufferOrPath, objectName, bucketName = THUMBNAILS_BUCKET) => {
	if (!bufferOrPath || !objectName || !bucketName) {
		throw new Error("uploadImage requires bufferOrPath, objectName, and bucketName.");
	}

	await ensureBucketExists(bucketName);
	const contentType = getImageContentType(objectName);

	if (Buffer.isBuffer(bufferOrPath)) {
		await minioClient.putObject(bucketName, objectName, bufferOrPath, bufferOrPath.length, {
			"Content-Type": contentType,
		});
	} else {
		await minioClient.fPutObject(bucketName, objectName, bufferOrPath, {
			"Content-Type": contentType,
		});
	}

	return {
		bucket: bucketName,
		objectName,
		path: `${bucketName}/${objectName}`,
	};
};

export const deleteImage = async (objectName, bucketName = THUMBNAILS_BUCKET) => {
	if (!objectName || !bucketName) {
		throw new Error("deleteImage requires objectName and bucketName.");
	}

	const normalizedObjectName = objectName.startsWith(`${bucketName}/`)
		? objectName.slice(bucketName.length + 1)
		: objectName;

	await ensureBucketExists(bucketName);
	await minioClient.removeObject(bucketName, normalizedObjectName);
};

export const deleteObjectByStoragePath = async (storagePath) => {
	if (!storagePath || typeof storagePath !== "string") {
		return;
	}

	const [bucketName, ...objectParts] = storagePath.split("/");
	const objectName = objectParts.join("/");

	if (!bucketName || !objectName) {
		return;
	}

	await ensureBucketExists(bucketName);
	await minioClient.removeObject(bucketName, objectName);
};

export { minioClient, RAW_VIDEOS_BUCKET };
