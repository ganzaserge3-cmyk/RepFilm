require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const localUploadsDir = process.env.UPLOADS_DIR || (process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads'));
if (!fs.existsSync(localUploadsDir)) fs.mkdirSync(localUploadsDir, { recursive: true });

const s3Bucket = process.env.S3_BUCKET;
const s3Region = process.env.S3_REGION;
const s3Public = process.env.S3_PUBLIC === 'true';

const s3Client = s3Bucket && s3Region ? new S3Client({ region: s3Region }) : null;

function isCloudEnabled() {
  return Boolean(s3Client && s3Bucket && s3Region);
}

function getLocalFileUrl(filename) {
  return `/uploads/${encodeURIComponent(filename)}`;
}

async function storeFileLocal(file) {
  const targetPath = path.join(localUploadsDir, file.filename);
  await fs.promises.rename(file.path, targetPath);
  return {
    storageKey: file.filename,
    fileUrl: getLocalFileUrl(file.filename),
  };
}

async function uploadToS3(file) {
  const body = fs.createReadStream(file.path);
  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: file.filename,
    Body: body,
    ContentType: file.mimetype,
  });
  await s3Client.send(command);
  await fs.promises.unlink(file.path).catch(() => {});
  const fileUrl = s3Public
    ? `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${encodeURIComponent(file.filename)}`
    : await getSignedUrl(s3Client, new GetObjectCommand({ Bucket: s3Bucket, Key: file.filename }), { expiresIn: 60 * 60 });
  return {
    storageKey: file.filename,
    fileUrl,
  };
}

async function storeFile(file) {
  if (isCloudEnabled()) {
    return uploadToS3(file);
  }
  return storeFileLocal(file);
}

module.exports = {
  isCloudEnabled,
  storeFile,
  getLocalFileUrl,
  localUploadsDir,
};
