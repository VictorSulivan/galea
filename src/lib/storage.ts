import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function envValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

export function storageConfigured() {
  return Boolean(envValue("NEON_STORAGE_ENDPOINT", "AWS_ENDPOINT_URL_S3") && envValue("NEON_STORAGE_ACCESS_KEY", "AWS_ACCESS_KEY_ID") && envValue("NEON_STORAGE_SECRET_KEY", "AWS_SECRET_ACCESS_KEY"));
}

function client() {
  return new S3Client({
    region: envValue("NEON_STORAGE_REGION", "AWS_REGION") || "us-east-2",
    endpoint: envValue("NEON_STORAGE_ENDPOINT", "AWS_ENDPOINT_URL_S3"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: envValue("NEON_STORAGE_ACCESS_KEY", "AWS_ACCESS_KEY_ID") ?? "",
      secretAccessKey: envValue("NEON_STORAGE_SECRET_KEY", "AWS_SECRET_ACCESS_KEY") ?? "",
    },
  });
}

export function bucketName() {
  return envValue("NEON_STORAGE_BUCKET") || "gaelia";
}

export function extensionFor(mime: string) {
  return TYPES[mime] ?? null;
}

export async function putAsset(key: string, body: Uint8Array, mime: string) {
  await client().send(
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: key,
      Body: body,
      ContentType: mime,
    }),
  );
}

export async function readAsset(key: string) {
  const result = await client().send(
    new GetObjectCommand({
      Bucket: bucketName(),
      Key: key,
    }),
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) return null;
  return { bytes, mime: result.ContentType ?? "application/octet-stream" };
}

export function mediaPath(key: string) {
  return `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function safeObjectKey(key: string) {
  if (!/^[a-z0-9][a-z0-9/_-]{0,180}$/.test(key) || key.includes("..")) return null;
  return key;
}
