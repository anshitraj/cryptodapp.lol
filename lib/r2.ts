import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// R2 is S3-API-compatible, so the plain AWS SDK works against it — just
// point the endpoint at the account's R2 URL instead of AWS.
function r2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

export function isAllowedLogoType(contentType: string): boolean {
  return contentType in ALLOWED_TYPES;
}

// Uploads one logo image and returns its public URL. Requires R2_BUCKET_NAME
// and R2_PUBLIC_URL (the bucket's public r2.dev URL or a custom domain
// mapped to it in the Cloudflare dashboard) in addition to the credentials
// above.
export async function uploadLogo(buffer: Buffer, contentType: string): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicUrl) {
    throw new Error("Missing R2_BUCKET_NAME or R2_PUBLIC_URL");
  }

  const ext = ALLOWED_TYPES[contentType];
  const key = `logos/${crypto.randomUUID()}.${ext}`;

  await r2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}
