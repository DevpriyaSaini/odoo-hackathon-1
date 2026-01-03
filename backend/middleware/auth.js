import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/**
 * Auth Middleware - Protects routes
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Expect header: Authorization: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
};

/**
 * Admin Only Middleware
 * Restricts route access to admin role only
 * Must be used after authMiddleware/protect
 */
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
};

// Alias exports for compatibility
export const protect = authMiddleware;

export default authMiddleware;
