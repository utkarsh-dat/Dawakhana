import { Router, Request, Response, NextFunction } from "express";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import { getPharmacistReviewQueue, processPrescriptionReview } from "../services/pharmacistReview";

const router = Router();

/**
 * All routes in this router require JWT Authentication and Pharmacist or Admin role.
 */
router.use(authenticateJWT);
router.use(authorizeRoles("pharmacist", "admin"));

/**
 * GET /api/pharmacist/prescriptions/queue
 * 
 * Returns pending prescriptions with customer details and time-limited signed URLs, paginated.
 * Accessible only by users with the 'pharmacist' (or 'admin') role.
 */
router.get("/prescriptions/queue", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || "pending";

    const queueResult = await getPharmacistReviewQueue(page, limit, status);

    return res.status(200).json({
      success: true,
      message: "Pharmacist review queue retrieved successfully.",
      ...queueResult,
    });
  } catch (error: any) {
    console.error("Error fetching pharmacist review queue:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch review queue.",
    });
  }
});

/**
 * POST /api/pharmacist/prescriptions/:id/review
 * 
 * Accepts status ('approved' or 'rejected'), pharmacist_notes, and an optional array of approved_medicine_ids.
 * Transactionally updates DB, auto-transitions linked orders ('rx_review' -> 'approved' or 'cancelled'),
 * and dispatches customer notification.
 */
router.post("/prescriptions/:id/review", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const pharmacistId = req.user!.id;
    const { status, pharmacist_notes, approved_medicine_ids } = req.body;

    if (!prescriptionId) {
      return res.status(400).json({ success: false, error: "Prescription ID path parameter is required." });
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing status. Allowed values: 'approved' or 'rejected'.",
      });
    }

    if (!pharmacist_notes || typeof pharmacist_notes !== "string" || pharmacist_notes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "pharmacist_notes string is required.",
      });
    }

    if (approved_medicine_ids && !Array.isArray(approved_medicine_ids)) {
      return res.status(400).json({
        success: false,
        error: "approved_medicine_ids must be an array of medicine string IDs if provided.",
      });
    }

    const reviewResult = await processPrescriptionReview({
      prescriptionId,
      pharmacistId,
      status,
      pharmacistNotes: pharmacist_notes.trim(),
      approvedMedicineIds: approved_medicine_ids,
    });

    return res.status(200).json({
      success: true,
      message: `Prescription #${prescriptionId} reviewed successfully: ${status.toUpperCase()}.`,
      data: reviewResult,
    });

  } catch (error: any) {
    console.error("Error processing pharmacist prescription review:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process prescription review.",
    });
  }
});

export default router;
