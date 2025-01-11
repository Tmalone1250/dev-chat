import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { promisify } from 'util';

const randomBytes = promisify(crypto.randomBytes);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'nature-chat-uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadResult {
  url: string;
  key: string;
}

export const generateUploadUrl = async (
  fileType: string,
  fileName: string
): Promise<UploadResult> => {
  const rawBytes = await randomBytes(16);
  const fileKey = `${rawBytes.toString('hex')}-${fileName}`;

  const putObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
    expiresIn: 60, // URL expires in 60 seconds
  });

  return {
    url: uploadUrl,
    key: fileKey,
  };
};

export const deleteFile = async (fileKey: string): Promise<void> => {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  await s3Client.send(deleteCommand);
};

export const getFileUrl = (fileKey: string): string => {
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
};

export const validateFile = (
  fileSize: number,
  fileType: string
): { valid: boolean; error?: string } => {
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds the maximum limit of 10MB',
    };
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: 'File type not supported',
    };
  }

  return { valid: true };
};

export const handleFileUpload = async (
  file: Express.Multer.File
): Promise<UploadResult> => {
  const validation = validateFile(file.size, file.mimetype);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const uploadResult = await generateUploadUrl(file.mimetype, file.originalname);
  return uploadResult;
};
