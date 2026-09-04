import { createClient } from "@supabase/supabase-js";

/**
 * Secure Storage Service
 * Handles uploading files to a private storage bucket (Supabase Storage or AWS S3)
 * and generating time-limited signed URLs to prevent public access.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://your-supabase-project.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";
const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || "prescriptions";

// Initialize Supabase Admin Client for secure server-side bucket access
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export interface UploadResult {
  storagePath: string;
  signedUrl: string;
  expiresInSeconds: number;
}

/**
 * Uploads a prescription buffer to private bucket and generates a time-limited signed URL.
 * 
 * @param fileBuffer - Raw Buffer of uploaded file
 * @param fileName - Original filename
 * @param mimeType - File MIME type (image/jpeg, image/png, application/pdf, etc.)
 * @param userId - ID of uploading customer
 * @param expiresInSeconds - Expiry duration for signed URL (default 3600s = 1 hr)
 */
export async function uploadPrivatePrescription(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  userId: string,
  expiresInSeconds: number = 3600
): Promise<UploadResult> {
  const sanitizeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const storagePath = `private/${userId}/${Date.now()}_${sanitizeFileName}`;

  // 1. Upload to Private Storage Bucket
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: "private, max-age=3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    throw new Error(`Failed to store prescription file: ${uploadError.message}`);
  }

  // 2. Generate Time-Limited Signed URL for secure private viewing
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (signedError || !signedData?.signedUrl) {
    console.error("Signed URL generation failed:", signedError);
    throw new Error("Failed to generate secure access URL for prescription.");
  }

  return {
    storagePath: uploadData.path,
    signedUrl: signedData.signedUrl,
    expiresInSeconds,
  };
}

/**
 * Generates a fresh signed URL for an existing private storage path.
 */
export async function getPrescriptionSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}
