const adminRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (!req.admin.permissions || !req.admin.permissions.includes(permission)) {
      return res.status(403).json({ message: `Access denied. Missing permission: ${permission}` });
    }
    next();
  };
};

module.exports = { adminRole, checkPermission };
