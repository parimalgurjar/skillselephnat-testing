const { v2: cloudinary } = require("cloudinary");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error("Cloudinary environment variables are missing");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

console.log("Cloudinary configured:", {
  cloud_name: cloudName,
  api_key_present: Boolean(apiKey),
  api_secret_length: apiSecret.length,
});

module.exports = cloudinary;