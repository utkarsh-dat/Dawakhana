import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import { uploadPrivatePrescription } from "../services/storage";
import { createPrescriptionRecord } from "../services/prescription";

const router = Router();

// Configure Multer for secure memory-buffer handling
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Limit

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file format '${file.mimetype}'. Allowed types: JPEG, PNG, WEBP, PDF.`));
    }
  },
});

/**
 * POST /api/prescriptions/upload
 * 
 * Authenticated Endpoint (Customer / Admin)
 * Accepts multipart/form-data with field 'prescription'.
 * 1. Validates JWT & checks user role.
 * 2. Uploads file to private storage bucket.
 * 3. Generates a time-limited signed URL.
 * 4. Inserts record into prescriptions table with status 'pending'.
 * 5. Triggers pharmacist review queue notification.
 */
router.post(
  "/upload",
  authenticateJWT,
  authorizeRoles("customer", "admin"),
  upload.single("prescription"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "No file provided. Please attach a file under field name 'prescription'.",
        });
      }

      const notes = req.body.notes ? String(req.body.notes) : undefined;
      const expiresInSeconds = 3600; // 1 hour time-limited signed URL

      // Step 1: Upload file to Private Storage (S3 / Supabase Storage)
      const { storagePath, signedUrl } = await uploadPrivatePrescription(
        file.buffer,
        file.originalname,
        file.mimetype,
        user.id,
        expiresInSeconds
      );

      // Step 2: Insert into database with status 'pending' & notify queue
      const prescriptionRecord = await createPrescriptionRecord({
        userId: user.id,
        imageUrl: storagePath, // Store private path in DB
        notes,
      });

      // Step 3: Return success response with time-limited signed URL
      return res.status(201).json({
        success: true,
        message: "Prescription uploaded successfully and queued for pharmacist review.",
        data: {
          prescriptionId: prescriptionRecord.id,
          status: prescriptionRecord.status,
          createdAt: prescriptionRecord.created_at,
          fileDetails: {
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
          },
          // Time-limited signed URL for viewing (prevents public access)
          signedUrl,
          expiresInSeconds,
        },
      });

    } catch (error: any) {
      console.error("Prescription upload error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "An unexpected error occurred during prescription upload.",
      });
    }
  }
);

// Express Multer Error Handling Middleware
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: `File size exceeds the 10MB limit.`,
      });
    }
    return res.status(400).json({ success: false, error: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next();
});

export default router;
