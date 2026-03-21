import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    [key: string]: any;
}

/**
 * Uploads a base64 image or a file path to Cloudinary.
 * @param fileContent Base64 string (with or without prefix) or image URL/path.
 * @param folder Cloudinary folder to store the image.
 */
export async function uploadToCloudinary(
    fileContent: string,
    folder: string = "stockinvest"
): Promise<string> {
    try {
        // Cloudinary handles base64 automatically
        const result = (await cloudinary.uploader.upload(fileContent, {
            folder: `stockinvest/${folder}`,
            resource_type: "auto",
        })) as CloudinaryUploadResult;

        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Failed to upload image to cloud storage");
    }
}

export default cloudinary;
