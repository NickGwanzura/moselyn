import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

let cachedClient: S3Client | undefined;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
]);

function getStorageConfig() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    throw new Error('Cloudflare R2 is not configured. Add the R2 credentials, bucket, and public base URL.');
  }
  cachedClient ??= new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client: cachedClient, bucket, publicBaseUrl };
}

export async function saveBlogImage(file: File): Promise<{ url: string; key: string }> {
  const extension = IMAGE_TYPES.get(file.type);
  if (!extension) throw new Error('Use a JPEG, PNG, WebP, or AVIF image.');
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) throw new Error('Image must be smaller than 8 MB.');
  const { client, bucket, publicBaseUrl } = getStorageConfig();
  const key = `blog/${randomUUID()}.${extension}`;
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return { key, url: `${publicBaseUrl}/${key}` };
}

export async function deleteBlogImage(url: string): Promise<void> {
  const { client, bucket, publicBaseUrl } = getStorageConfig();
  if (!url.startsWith(`${publicBaseUrl}/blog/`)) return;
  const key = url.slice(publicBaseUrl.length + 1);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
