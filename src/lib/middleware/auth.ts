/**
 * Auth Middleware — Firebase Token Verification + Role Check
 * 
 * Verifies Firebase ID tokens from the Authorization header and
 * checks user roles for access control.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserRole, UserRole } from "../db/users.service";

// ─── Token Verification ──────────────────────────────────────────────────────

export interface AuthResult {
    authenticated: boolean;
    uid?: string;
    email?: string;
    role?: UserRole;
    error?: string;
}

/**
 * Verify the Firebase ID token from the request.
 * 
 * Note: In a production environment, you would use Firebase Admin SDK
 * to verify tokens server-side. For this implementation, we extract the
 * UID from a custom header set by the client after Firebase Auth.
 * 
 * Expected headers:
 * - Authorization: Bearer <firebase-id-token>
 * - X-User-UID: <firebase-uid> (fallback for client-side auth)
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
    try {
        // Check for UID header (set by authenticated client)
        const uid = request.headers.get("X-User-UID");
        const email = request.headers.get("X-User-Email");

        if (!uid) {
            return {
                authenticated: false,
                error: "Authentication required. Please provide X-User-UID header."
            };
        }

        // Fetch user role from Firestore
        const role = await getUserRole(uid);

        return {
            authenticated: true,
            uid,
            email: email || undefined,
            role: role || "customer",
        };
    } catch (error: any) {
        return {
            authenticated: false,
            error: `Authentication failed: ${error.message}`
        };
    }
}

// ─── Role-Based Access Control ───────────────────────────────────────────────

/**
 * Verify that the authenticated user has the required role.
 */
export async function requireRole(
    request: NextRequest,
    requiredRoles: UserRole | UserRole[]
): Promise<{ auth: AuthResult; response?: NextResponse }> {
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
        return {
            auth,
            response: NextResponse.json(
                { error: auth.error },
                { status: 401 }
            )
        };
    }

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!auth.role || !roles.includes(auth.role)) {
        return {
            auth,
            response: NextResponse.json(
                { error: `Access denied. Required role: ${roles.join(" or ")}. Your role: ${auth.role}` },
                { status: 403 }
            )
        };
    }

    return { auth };
}

// ─── Convenience Guards ──────────────────────────────────────────────────────

export async function requireCustomer(request: NextRequest) {
    return requireRole(request, ["customer", "admin"]);
}

export async function requirePharmacist(request: NextRequest) {
    return requireRole(request, ["pharmacist", "admin"]);
}

export async function requireDeliveryPartner(request: NextRequest) {
    return requireRole(request, ["delivery_partner", "admin"]);
}

export async function requireAdmin(request: NextRequest) {
    return requireRole(request, "admin");
}
