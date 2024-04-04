import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      media_metadata: true,
    });

    console.log("file is uploaded sucessfully", cloudinaryResponse);
    fs.unlinkSync(localFilePath);

    return cloudinaryResponse;
  } catch (error) {
    fs.unlinkSync(localFilePath);

    throw new ApiError(500, error.messsage || "upload file on cloudinary failed");
  }
};

const deleteOnCloudinary = async (public_id, resource_type = "image") => {
  try {
    if (!public_id) return null;

    //delete file from cloudinary
    await cloudinary.uploader.destroy(public_id, {
      resource_type: `${resource_type}`,
    });
  } catch (error) {
    throw new ApiError(500, error.messsage || "delete on cloudinary failed");
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
