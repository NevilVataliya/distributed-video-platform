import 'dotenv/config';
import { Client } from "minio";
import fs from "fs";
import path from "path";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "minio";
const MINIO_PORT = parseInt(process.env.MINIO_PORT || "9000", 10);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === "true"||false;
const MINIO_ACCESS_KEY =
	process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "minioadmin";
const MINIO_SECRET_KEY =
	process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "minioadmin";

const RAW_VIDEOS_BUCKET = "raw-videos";
const PROCESSED_VIDEOS_BUCKET = "processed-videos";
const THUMBNAILS_BUCKET = "thumbnails";

const minioClient = new Client({
	endPoint: MINIO_ENDPOINT,
	port: MINIO_PORT,
	useSSL: MINIO_USE_SSL,
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY,
});

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
		await minioClient.makeBucket(bucketName, "us-east-1");
		console.log(`[MinIO] Created bucket: ${bucketName}`);
	}

	if (bucketName === PROCESSED_VIDEOS_BUCKET || bucketName === THUMBNAILS_BUCKET) {
		await setPublicReadPolicy(bucketName);
		console.log(`[MinIO] Set Public Read policy on bucket: ${bucketName}`);
	}
};

const walkFilesRecursively = (dirPath) => {
	const collected = [];
	const entries = fs.readdirSync(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			collected.push(...walkFilesRecursively(fullPath));
			continue;
		}

		if (entry.name.endsWith(".m3u8") || entry.name.endsWith(".ts")) {
			collected.push(fullPath);
		}
	}

	return collected;
};

const getContentType = (filePath) => {
	if (filePath.endsWith(".m3u8")) {
		return "application/vnd.apple.mpegurl";
	}
	if (filePath.endsWith(".ts")) {
		return "video/mp2t";
	}
	return "application/octet-stream";
};

export const downloadRawVideo = async (name, localPath) => {
	if (!name || !localPath) {
		throw new Error("downloadRawVideo requires both name and localPath.");
	}

	fs.mkdirSync(path.dirname(localPath), { recursive: true });
	await minioClient.fGetObject(RAW_VIDEOS_BUCKET, name, localPath);

	return localPath;
};

export const uploadHLSFolder = async (folderPath, bucket, destinationFolder) => {
    if (!folderPath || !bucket || !destinationFolder) {
        throw new Error("uploadHLSFolder requires folderPath, bucket, and destinationFolder.");
    }

    await ensureBucketExists(bucket);
    const files = walkFilesRecursively(folderPath);

    // Create an array of upload promises
    const uploadPromises = files.map((filePath) => {
        const relativePath = path.relative(folderPath, filePath).replace(/\\/g, "/");
        const objectName = `${destinationFolder}/${relativePath}`;

        return minioClient.fPutObject(bucket, objectName, filePath, {
            "Content-Type": getContentType(filePath),
        });
    });

    // Execute all uploads concurrently
    await Promise.all(uploadPromises);

    return files.length;
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

	await ensureBucketExists(bucketName);
	await minioClient.removeObject(bucketName, objectName);
};

export { minioClient, RAW_VIDEOS_BUCKET };
