import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type UserRole = "customer" | "pharmacist" | "admin";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: UserRole;
}

// Extend Express Request interface to carry decoded user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback_super_secret_jwt_key_32bytes!";

/**
 * Authentication Middleware
 * Validates standard Bearer JWT tokens from the Authorization header.
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authorization header missing or invalid format. Format: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Extract payload fields (compatible with standard JWT & Supabase auth tokens)
    const userRole: UserRole = decoded.role || decoded.user_metadata?.role || "customer";
    const userId: string = decoded.sub || decoded.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Invalid token payload: missing user ID." });
    }

    req.user = {
      id: userId,
      email: decoded.email,
      role: userRole,
    };

    next();
  } catch (error: any) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({
      success: false,
      error: "Invalid or expired JWT token.",
    });
  }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces allowed user roles for endpoint access.
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Unauthenticated request." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Required role [${allowedRoles.join(", ")}], but your role is '${req.user.role}'`,
      });
    }

    next();
  };
};
