/**
 * Middleware to check if admin is authenticated
 */
export const requireAdminAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }

  // If it's an API request, return JSON error
  if (req.path.startsWith('/admin/api/')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication required',
    });
  }

  // Otherwise redirect to login
  res.redirect('/admin/login');
};

