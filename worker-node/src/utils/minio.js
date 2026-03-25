import 'dotenv/config';
import { Client } from "minio";
import fs from "fs";
import path from "path";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || "localhost";
const MINIO_PORT = parseInt(process.env.MINIO_PORT || "9000", 10);
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === "true"||false;
const MINIO_ACCESS_KEY =
	process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER || "minioadmin";
const MINIO_SECRET_KEY =
	process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD || "minioadmin";

const RAW_VIDEOS_BUCKET = "raw-videos";
const PROCESSED_VIDEOS_BUCKET = "processed-videos";

const minioClient = new Client({
	endPoint: MINIO_ENDPOINT,
	port: MINIO_PORT,
	useSSL: MINIO_USE_SSL,
	accessKey: MINIO_ACCESS_KEY,
	secretKey: MINIO_SECRET_KEY,
});

const ensureBucketExists = async (bucketName) => {
	const exists = await minioClient.bucketExists(bucketName);
	if (!exists) {
		await minioClient.makeBucket(bucketName, "us-east-1");
		console.log(`[MinIO] Created bucket: ${bucketName}`);

		// AUTOMATION: If it's the processed videos bucket, make it public immediately
		if (bucketName === PROCESSED_VIDEOS_BUCKET) {
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
			console.log(`[MinIO] Set Public Read policy on bucket: ${bucketName}`);
		}
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

export { minioClient, RAW_VIDEOS_BUCKET };
