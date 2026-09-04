import { Router, Request, Response, NextFunction } from "express";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import { placeOrderWithFEFO } from "../services/orderEngine";

const router = Router();

/**
 * POST /api/orders/checkout
 * 
 * Authenticated Endpoint (Customer / Admin)
 * Executes FEFO inventory deduction and creates an order within an ACID transaction.
 */
router.post(
  "/checkout",
  authenticateJWT,
  authorizeRoles("customer", "admin"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { shippingAddressId, prescriptionId, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Request body must contain an 'items' array with { medicineId, quantity }.",
        });
      }

      const result = await placeOrderWithFEFO({
        userId,
        shippingAddressId,
        prescriptionId,
        items,
      });

      return res.status(201).json({
        success: true,
        message: "Order placed successfully with FEFO batch allocation.",
        data: result,
      });

    } catch (error: any) {
      console.error("Order Checkout Error:", error);
      return res.status(400).json({
        success: false,
        error: error.message || "Failed to process order checkout.",
      });
    }
  }
);

export default router;
