/**
 * Admin Only Middleware
 * Restricts route access to admin role only
 * Must be used after authMiddleware
 */
export const adminOnlyMiddleware = (req, res, next) => {
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

export default adminOnlyMiddleware;
