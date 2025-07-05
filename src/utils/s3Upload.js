const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.BUCKET_NAME;

exports.s3 = s3;

exports.uploadImage = async (fileBuffer, userId, originalFileName) => {
  const ext = path.extname(originalFileName);
  const key = `user/profilepics/${userId}${ext}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: getContentType(ext),
    ACL: "public-read",
  };

  const data = await s3.upload(uploadParams).promise();
  return data.Location;
};

function getContentType(ext) {
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return types[ext.toLowerCase()] || "application/octet-stream";
}
